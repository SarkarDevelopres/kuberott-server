const User = require('../db/models/user');
const Employee = require('../db/models/employee');
const jwt = require('jsonwebtoken');
// const { sendEmail } = require('../services/sendmail');
const dotenv = require('dotenv');
dotenv.config();


const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

exports.employeeLogin = async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(401).json({ ok: false, message: "Data missing" });
        };

        let employee = await Employee.findOne({ email: email }).select('empId password');

        if (!employee) {
            return res.status(402).json({ ok: false, message: "Invalid credentials" });
        }

        let isPasswordCorrect = await employee.comparePassword(password);

        if (!isPasswordCorrect) {
            return res.status(402).json({ ok: false, message: "Invalid credentials" });
        }

        let token = jwt.sign({ empId: employee.empId }, process.env.JWT_SECRET, { expiresIn: "12h" });

       return res.status(200).json({ ok: true, token: token, data: employee });


    } catch (error) {
        res.status(500).json({ ok: false, message: error.message })
    }
}
exports.employeeAuthenticate = async (req, res) => {
    try {
        const { code, token } = req.body;

        if (!code || !token) {
            return res.status(400).json({ ok: false, message: "Code not given" });
        }

        let decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        if (code != decodedToken.code) {
            return res.status(400).json({ ok: false, message: "Invalid OTP" });
        }

        let employee = await Employee.findOne({ empId: decodedToken.empId }).lean();

        if (!employee) {
            return res.status(404).json({ ok: false, message: "Employee not found" });
        }

        let newToken = jwt.sign({ empId: employee.empId }, process.env.JWT_SECRET, { expiresIn: "24h" });

        return res.status(200).json({ ok: true, token: newToken, data: employee });

    } catch (error) {
        res.status(500).json({ ok: false, message: error.message })
    }
}
exports.userLogin = async (req, res) => {
    try {

        console.log("Ï am called");
        

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(401).json({ ok: false, message: "Data missing" });
        }

        let user = await User.findOne({"email.email": email}).select('email password');

        if (!user) {
            return res.status(402).json({ ok: false, message: "Invalid credentials" });
        }

        let isPasswordCorrect = await user.comparePassword(password);

        if (!isPasswordCorrect) {
            return res.status(402).json({ ok: false, message: "Invalid credentials" });
        }

        console.log(user);
        

        let token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

        return res.status(200).json({ ok: true, message: "Login successful", token: token });

    } catch (error) {
        console.log(error.message);        
        res.status(500).json({ ok: false, message: error.message })
    }
}
exports.userSignUp = async (req, res) => {
    try {
        const { name, phone, email, password } = req.body;

        if (!password || !email) {
            return res.status(400).json({ ok: false, message: "Data not provided" });
        }

        let isValidEmail = validateEmail(email);

        if (!isValidEmail) {
            return res.status(400).json({ ok: false, message: "Invalid email provided" });
        }

        // Check is user exists
        let user = await User.findOne({ "email.email": email });

        if (user) {
            return res.status(404).json({ ok: false, message: "User already exists" });
        }

        // Save user data
        let newUser = new User({
            name: name,
            phone: {
                number: Number(phone),
                verified: true
            },
            email: {
                email: email,
                verified: true
            },
            password: password
        });

        let newUserData = await newUser.save();
        console.log(newUserData);

        return res.status(200).json({
            ok: true,
            message: "User created successfully"
        });

    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
}

exports.createDummyUsers = async (req, res) => {
    try {

        const dummyUsers = [
            {
                firstname: "Riya",
                lastname: "Sen",
                gender: "female",
                interestedIn: ["male"],
                city: "Kolkata, West Bengal",
                religion: "Hindu",
                political: "Apolitical",
                height: "5'3",
                familyPlan: "Not sure",
                work: "Content Writer",
                degree: "BA English",
                datingPlan: "Long-term",
                drink: "No",
                smoke: "No",
                language: ["Hindi", "Bengali", "English"],
                zodiac: "Leo",
                phone: { number: "9000000001", verified: true },
                email: { address: "riya.sen@test.com", verified: true },
            },
            {
                firstname: "Anushka",
                lastname: "Roy",
                gender: "female",
                interestedIn: ["male"],
                city: "Kolkata, West Bengal",
                religion: "Hindu",
                political: "Moderate",
                height: "5'4",
                familyPlan: "Want children",
                work: "Nurse",
                degree: "BSc Nursing",
                datingPlan: "Serious",
                drink: "Occasionally",
                smoke: "No",
                language: ["Bengali", "English"],
                zodiac: "Virgo",
                phone: { number: "9000000002", verified: true },
                email: { address: "anushka.roy@test.com", verified: true },
            },
            {
                firstname: "Sreya",
                lastname: "Mukherjee",
                gender: "female",
                interestedIn: ["male"],
                city: "Kolkata, West Bengal",
                religion: "Hindu",
                political: "Left",
                height: "5'2",
                familyPlan: "Open to both",
                work: "Graphic Designer",
                degree: "BFA",
                datingPlan: "Long-term or Marriage",
                drink: "No",
                smoke: "No",
                language: ["Bengali", "English", "Hindi"],
                zodiac: "Pisces",
                phone: { number: "9000000003", verified: true },
                email: { address: "sreya.mukherjee@test.com", verified: true },
            },
            {
                firstname: "Pragya",
                lastname: "Mishra",
                gender: "female",
                interestedIn: ["male"],
                city: "Patna, Bihar",
                religion: "Hindu",
                political: "Conservative",
                height: "5'5",
                familyPlan: "Want children",
                work: "Teacher",
                degree: "MA History",
                datingPlan: "Marriage",
                drink: "No",
                smoke: "No",
                language: ["Hindi", "English"],
                zodiac: "Cancer",
                phone: { number: "9000000004", verified: true },
                email: { address: "pragya.mishra@test.com", verified: true },
            },
            {
                firstname: "Fatima",
                lastname: "Khan",
                gender: "female",
                interestedIn: ["male"],
                city: "Hyderabad, Telangana",
                religion: "Muslim",
                political: "Apolitical",
                height: "5'4",
                familyPlan: "Later",
                work: "Software Engineer",
                degree: "BTech CSE",
                datingPlan: "Long-term",
                drink: "No",
                smoke: "No",
                language: ["Hindi", "English", "Urdu"],
                zodiac: "Libra",
                phone: { number: "9000000005", verified: true },
                email: { address: "fatima.khan@test.com", verified: true },
            },
            {
                firstname: "Niharika",
                lastname: "Sharma",
                gender: "female",
                interestedIn: ["male"],
                city: "New Delhi, Delhi",
                religion: "Hindu",
                political: "Right",
                height: "5'6",
                familyPlan: "Not sure",
                work: "HR Executive",
                degree: "MBA",
                datingPlan: "Long-term",
                drink: "Rarely",
                smoke: "No",
                language: ["Hindi", "English"],
                zodiac: "Sagittarius",
                phone: { number: "9000000006", verified: true },
                email: { address: "niharika.sharma@test.com", verified: true },
            },
            {
                firstname: "Meghna",
                lastname: "Das",
                gender: "female",
                interestedIn: ["male"],
                city: "Kolkata, West Bengal",
                religion: "Hindu",
                political: "Moderate",
                height: "5'1",
                familyPlan: "Open to both",
                work: "Architect",
                degree: "BArch",
                datingPlan: "Serious",
                drink: "No",
                smoke: "No",
                language: ["Bengali", "English", "Hindi"],
                zodiac: "Scorpio",
                phone: { number: "9000000007", verified: true },
                email: { address: "meghna.das@test.com", verified: true },
            },
            {
                firstname: "Aisha",
                lastname: "Pathan",
                gender: "female",
                interestedIn: ["male"],
                city: "Mumbai, Maharashtra",
                religion: "Muslim",
                political: "Moderate",
                height: "5'5",
                familyPlan: "Not sure",
                work: "Marketing Analyst",
                degree: "BMS",
                datingPlan: "Long-term",
                drink: "Occasionally",
                smoke: "No",
                language: ["English", "Hindi"],
                zodiac: "Aries",
                phone: { number: "9000000008", verified: true },
                email: { address: "aisha.pathan@test.com", verified: true },
            },
            {
                firstname: "Arjun",
                lastname: "Sarkar",
                gender: "male",
                interestedIn: ["female"],
                city: "Kolkata, West Bengal",
                religion: "Hindu",
                political: "Right",
                height: "5'9",
                familyPlan: "Want children",
                work: "Software Developer",
                degree: "BTech CSE",
                datingPlan: "Long-term",
                drink: "Occasionally",
                smoke: "No",
                language: ["Hindi", "English", "Bengali"],
                zodiac: "Capricorn",
                phone: { number: "9000000009", verified: true },
                email: { address: "arjun.sarkar@test.com", verified: true },
            },
            {
                firstname: "Kabir",
                lastname: "Mehta",
                gender: "male",
                interestedIn: ["female"],
                city: "New Delhi, Delhi",
                religion: "Hindu",
                political: "Moderate",
                height: "5'10",
                familyPlan: "Not sure",
                work: "Fitness Trainer",
                degree: "BCom",
                datingPlan: "Casual or Serious",
                drink: "Rarely",
                smoke: "No",
                language: ["Hindi", "English"],
                zodiac: "Gemini",
                phone: { number: "9000000010", verified: true },
                email: { address: "kabir.mehta@test.com", verified: true }
            }
        ];

        for (let i = 0; i < dummyUsers.length; i++) {

            // 1. LOCATION
            let city = dummyUsers[i].city;
            let matchedCity = cities.find(c => c.name === city);

            dummyUsers[i].location = {
                type: "Point",
                coordinates: [matchedCity.lng, matchedCity.lat]
            };

            // 2. HEIGHT CONVERSION
            let height = dummyUsers[i].height;               // example: "5'6"
            let actualHeight = convertHeightToCM(height);

            dummyUsers[i].displayHeight = height;
            dummyUsers[i].height = actualHeight;             // cm value

            // 3. RANDOM DOB
            let dob = randomDOB();                           // date object
            dummyUsers[i].dob = dob;

            // 4. AGE
            dummyUsers[i].age = calculateAge(dob);
        }


        await User.insertMany(dummyUsers);

        return res.status(200).json({
            ok: true,
            message: "10 dummy users created with zodiac signs"
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false, message: "Error creating dummy users" });
    }
};
