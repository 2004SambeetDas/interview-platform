const getInterview = (req, res) => {
    res.json({
        message:" Interview fetched successfully",  
        interview :
        {
            id: 1,
            role: "Software Engineer",
            mode: "Coding Round"
        }
    });
};

const createInterview = (req, res) => {
    const interviewData = req.body;

    res.json({
        message: "Interview created successfully",
        interview: interviewData
    });
};

module.exports = {
    getInterview,
    createInterview
};
