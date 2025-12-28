const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const employeeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        empId: {
            type: String,
            required: true,
            unique: true
        },

        department:{
            type: String,
            enum:[
                'Engineering',
                'Sales',
                'Marketing',
                'HR',
                'Finance',
                'Operations', 
                'Support',
                'Executive'
            ],
            required: true,
        },

        post: {
            type: String,
            enum: [
                // Executive & Board
                "Chief Executive Officer",
                "Managing Director",
                "Executive Director",
                "Chief Operating Officer",
                "Chief Financial Officer",
                "Chief Technology Officer",
                "Chief Information Officer",
                "Chief Data Officer",
                "Chief Security Officer",
                "Chief Marketing Officer",
                "Chief Growth Officer",
                "Chief Revenue Officer",
                "Chief Product Officer",
                "Chief Human Resources Officer",
                "Chief Legal Officer",
                "Chief Compliance Officer",
                "Chief Strategy Officer",
                "Chief Innovation Officer",
                "Chief Risk Officer",
                "Board Member",
                "Chairman",
                "Vice Chairman",

                // Senior Leadership & Directors
                "Director",
                "Technical Director",
                "Operations Director",
                "Finance Director",
                "Marketing Director",
                "Sales Director",
                "Product Director",
                "Engineering Director",
                "HR Director",
                "Legal Director",
                "Strategy Director",
                "Regional Director",
                "Country Director",

                // Management
                "Senior Manager",
                "Manager",
                "Assistant Manager",
                "Associate Manager",
                "Team Lead",
                "Project Manager",
                "Program Manager",
                "Delivery Manager",
                "Operations Manager",
                "Business Manager",

                // Technology & Engineering
                "Principal Engineer",
                "Senior Software Engineer",
                "Software Engineer",
                "Junior Software Engineer",
                "Trainee Engineer",
                "Frontend Developer",
                "Backend Developer",
                "Full Stack Developer",
                "Mobile App Developer",
                "Web Developer",
                "Game Developer",
                "DevOps Engineer",
                "Cloud Engineer",
                "Infrastructure Engineer",
                "Site Reliability Engineer",
                "QA Engineer",
                "Test Engineer",
                "Automation Engineer",
                "Security Engineer",
                "Data Engineer",
                "Machine Learning Engineer",
                "AI Engineer",
                "Blockchain Developer",
                "Embedded Systems Engineer",
                "Systems Architect",
                "Solutions Architect",
                "Technical Lead",
                "Engineering Manager",

                // Product & Design
                "Product Manager",
                "Associate Product Manager",
                "Product Owner",
                "Business Analyst",
                "Technical Analyst",
                "UX Designer",
                "UI Designer",
                "Product Designer",
                "Interaction Designer",
                "Visual Designer",
                "Design Lead",
                "Creative Director",

                // Marketing
                "Marketing Manager",
                "Senior Marketing Manager",
                "Marketing Executive",
                "Marketing Coordinator",
                "Marketing Associate",
                "Digital Marketing Manager",
                "Digital Marketing Executive",
                "Performance Marketing Manager",
                "Growth Marketing Manager",
                "Brand Manager",
                "Content Manager",
                "Content Strategist",
                "Copywriter",
                "SEO Specialist",
                "SEM Specialist",
                "Social Media Manager",
                "Community Manager",
                "Influencer Marketing Manager",
                "PR Manager",
                "Communications Manager",

                // Sales & Business Development
                "Sales Director",
                "Sales Manager",
                "Senior Sales Manager",
                "Business Development Manager",
                "Business Development Executive",
                "Sales Executive",
                "Sales Associate",
                "Account Manager",
                "Key Account Manager",
                "Client Relationship Manager",
                "Customer Success Manager",
                "Customer Success Executive",
                "Pre-Sales Engineer",
                "Inside Sales Executive",
                "Field Sales Executive",

                // Finance & Accounts
                "Finance Manager",
                "Senior Accountant",
                "Accountant",
                "Junior Accountant",
                "Accounts Executive",
                "Accounts Assistant",
                "Financial Analyst",
                "Cost Accountant",
                "Tax Consultant",
                "Auditor",
                "Internal Auditor",
                "Payroll Executive",
                "Billing Executive",

                // Human Resources & Administration
                "HR Manager",
                "HR Business Partner",
                "HR Executive",
                "HR Generalist",
                "Talent Acquisition Manager",
                "Recruiter",
                "Training Manager",
                "Learning & Development Executive",
                "People Operations Manager",
                "Admin Manager",
                "Office Manager",
                "Office Administrator",
                "Office Staff",

                // Legal, Compliance & Risk
                "Legal Counsel",
                "Corporate Lawyer",
                "Compliance Officer",
                "Risk Manager",
                "Company Secretary",
                "Contracts Manager",
                "IP Manager",

                // Operations & Support
                "Operations Executive",
                "Operations Coordinator",
                "Supply Chain Manager",
                "Procurement Manager",
                "Procurement Executive",
                "Logistics Manager",
                "Warehouse Manager",
                "Inventory Manager",
                "Facility Manager",

                // Customer Support
                "Customer Support Manager",
                "Customer Support Lead",
                "Customer Support Executive",
                "Technical Support Engineer",
                "Helpdesk Executive",
                "Call Center Executive",

                // Research & Strategy
                "Research Analyst",
                "Market Research Analyst",
                "Strategy Analyst",
                "Strategy Manager",
                "Policy Analyst",

                // Interns & Trainees
                "Tech Intern",
                "Software Intern",
                "Data Intern",
                "Sales Intern",
                "Marketing Intern",
                "HR Intern",
                "Finance Intern",
                "Operations Intern",
                "Management Intern",
                "Graduate Trainee",
                "Management Trainee",

                // On-Ground & Maintenance
                "Security Officer",
                "Watchman",
                "Janitor",
                "Housekeeping Staff",
                "Maintenance Technician",
            ],
                required: true
        },

        role: {
            type: String,
            enum: ["employee", "admin"],
            default: "employee"
        },

        adminAccessStart: {
            type: Date,
            default: null
        },

        adminAccessEnd: {
            type: Date,
            default: null
        },

        address: {
            type: String,
            required: true
        },

        salary: {
            type: Number,
            required: true
        },

        totalLeaves: {
            type: Number,
            default: 0
        },

        age: {
            type: Number,
            required: true
        },

        dob: {
            type: Date,
            required: true
        },

        aadharNo: {
            type: String,
            unique: true,
            length: 12
        },
        panNo: {
            type: String,
            unique: true,
            length: 10
        },

        joiningDate: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: ["active", "inactive", "terminated", "resigned"],
            default: "active"
        },

        password: {
            type: String,
            required: true,
            select: false
        }
    },
    { timestamps: true }
);

employeeSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

employeeSchema.methods.comparePassword = async function (plainPassword) {
    return await bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model("Employee", employeeSchema);



