const Case = require('../models/Case');
const User = require('../models/User');

// @desc    Get all cases (Admin/Investigator sees all, Analyst sees assigned)
// @route   GET /api/cases
// @access  Private
exports.getCases = async (req, res) => {
    try {
        let query = {};

        // Access Control Logic:
        // 1. Analyst: Can see ALL cases to track everything.
        // 2. Admin: Can see cases they created (or assigned to them).
        // 3. Investigator: Can see cases assigned to them or created by them.

        if (req.user.role === 'analyst') {
            query = {}; // Analyst sees everything
        } else {
            // Admin & Investigator see only their related cases
            query = {
                $or: [
                    { assignedTo: req.user.id },
                    { createdBy: req.user.id }
                ]
            };
        }

        const cases = await Case.find(query)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');

        res.status(200).json(cases);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single case
// @route   GET /api/cases/:id
// @access  Private
exports.getCase = async (req, res) => {
    try {
        const caseItem = await Case.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');

        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }

        // Authorization check could go here if strict access control is needed per case

        res.status(200).json(caseItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new case
// @route   POST /api/cases
// @access  Private (Admin only?) -> Requirement: "Admin can create, assign, update cases"
exports.createCase = async (req, res) => {
    try {
        const { title, description, priority, assignedTo } = req.body;

        const caseItem = await Case.create({
            title,
            description,
            priority,
            assignedTo,
            createdBy: req.user.id
        });

        // Notify Investigator if assigned
        if (assignedTo) {
            try {
                const Notification = require('../models/Notification');
                const io = req.app.get('socketio');

                const notification = await Notification.create({
                    recipient: assignedTo,
                    message: `You have been assigned to case: ${title}`,
                    type: 'info',
                    link: `/cases/${caseItem._id}`,
                    relatedLink: `/cases/${caseItem._id}` // Add this field as it is in the schema but was missing in the create call
                });

                // Emit to specific user room
                if (io) {
                    io.to(assignedTo).emit('notification', notification);
                } else {
                    console.warn("Socket.io instance not found in app settings.");
                }
            } catch (notifyError) {
                console.error("Error creating notification or sending socket event:", notifyError);
                // Do not fail the request if notification fails
            }
        }

        res.status(201).json(caseItem);
    } catch (error) {
        console.error("Error in createCase:", error);
        res.status(500).json({ message: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
    }
};

// @desc    Update case
// @route   PUT /api/cases/:id
// @access  Private (Admin)
exports.updateCase = async (req, res) => {
    try {
        let caseItem = await Case.findById(req.params.id);

        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }

        caseItem = await Case.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json(caseItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete case
// @route   DELETE /api/cases/:id
// @access  Private (Admin)
exports.deleteCase = async (req, res) => {
    try {
        const caseItem = await Case.findById(req.params.id);

        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }

        await caseItem.remove(); // or findByIdAndDelete

        res.status(200).json({ message: 'Case removed' });
    } catch (error) {
        // remove() might be deprecated in newer mongoose, using deleteOne
        await Case.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Case removed' });
    }
};
