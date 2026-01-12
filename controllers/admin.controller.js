const jwt = require("jsonwebtoken");
const { cloudinaryVideoUploadURL, deleteFromCloudinary } = require("../services/signedVideoUrlCloudinary");
const { getUploadUrl, deleteFromS3 } = require('./s3Controller');
const User = require('../db/models/user');
const Employee = require('../db/models/employee');
const Movie = require('../db/models/movie');
const Watched = require("../db/models/watched");

async function AuthValid(authHeader) {

    if (!authHeader) {
        return {
            ok: false,
            code: "EMPTY_TOKEN",
            message: "No token provided"
        };
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
        return {
            ok: false,
            code: "INVALID_FORMAT",
            message: "Invalid auth format"
        };
    }

    if (!token) {
        return {
            ok: false,
            code: "INVALID_TOKEN",
            message: "Unauthorised Access"
        };
    }

    let decodedToken;
    let adminId;

    try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        adminId = decodedToken.empId;
    } catch (err) {
        console.log(err.name);

        if (err.name === "TokenExpiredError") {
            return {
                ok: false,
                code: "TOKEN_EXPIRED",
                message: "Session expired. Please login again."
            };
        }

        return {
            ok: false,
            code: "INVALID_TOKEN",
            message: "Invalid authentication token."
        };
    }

    let isAdmin = await Employee.findOne({
        empId: adminId,
        $or: [
            { role: "admin" },
            {
                role: "employee",
                adminAccessEnd: { $gt: new Date() }
            }
        ]
    });

    if (!isAdmin) {
        return {
            ok: false,
            code: "UNAUTHORISED",
            message: `Unathorised Access !`
        };
    } else {
        return {
            ok: true,
            id: adminId
        }
    }
}

function getAgeFromDOB(dob) {
    // Expected format: DD-MM-YYYY
    if (typeof dob !== "string") return null;

    const [day, month, year] = dob.split("-").map(Number);

    if (!day || !month || !year) return null;

    const today = new Date();
    const birthDate = new Date(year, month - 1, day);

    // Invalid date check (e.g., 31-02-2020)
    if (
        birthDate.getFullYear() !== year ||
        birthDate.getMonth() !== month - 1 ||
        birthDate.getDate() !== day
    ) {
        return null;
    }

    let age = today.getFullYear() - year;

    const hasHadBirthdayThisYear =
        today.getMonth() > month - 1 ||
        (today.getMonth() === month - 1 && today.getDate() >= day);

    if (!hasHadBirthdayThisYear) {
        age--;
    }

    return age;
}

function convertDDMMYYToISO(dob, timeZoneOffset = "+00:00") {
    // Expected input format: DD-MM-YYYY
    if (typeof dob !== "string") return null;

    const [day, month, year] = dob.split("-").map(Number);

    if (!day || !month || !year) return null;

    // Create UTC date (default time set to 00:00:00.000)
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    // Validate date (e.g. 31-02-24)
    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }

    // Format to ISO-like string with timezone offset
    const isoString =
        date.toISOString().replace("Z", timeZoneOffset);

    return isoString;
}

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

exports.startUpData = async (req, res) => {
    try {

        const authHeader = req.headers.authorization;
        let isValid = await AuthValid(authHeader);

        if (!isValid.ok) {
            return res.status(403).json(isValid);
        }

        let movieCount = await Movie.countDocuments();
        let userCount = await User.countDocuments();
        let employeeCount = await Employee.countDocuments();

        const watched = await Watched.aggregate([
            { $limit: 50 },

            {
                $addFields: {
                    movieObjId: { $toObjectId: "$movieId" },
                    userObjId: { $toObjectId: "$userId" }
                }
            },

            {
                $lookup: {
                    from: "movies",
                    localField: "movieObjId",
                    foreignField: "_id",
                    as: "movie"
                }
            },
            { $unwind: "$movie" },

            {
                $lookup: {
                    from: "users",
                    localField: "userObjId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },

            {
                $project: {
                    _id: 0,
                    movieName: "$movie.title",
                    movieId: "$movieId",
                    userName: "$user.name",
                    userId: "$userId",
                    duration: 1,
                    adsWatched: 1,
                    time: "$updatedAt"
                }
            }
        ]);


        const startOfYear = new Date(new Date().getFullYear(), 0, 1);  // Jan 1, YYYY
        const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999); // Dec 31, YYYY

        const userPerMonth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfYear, $lte: endOfYear }
                }
            },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" } },
                    totalUsers: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.month": 1 }
            },
            {
                $project: {
                    _id: 0,
                    month: "$_id.month",
                    totalUsers: 1
                }
            }
        ]);

        const totalSpace = await Movie.aggregate([
            {
                $group: {
                    _id: null,
                    totalDataUsed: { $sum: "$mediaSize" }
                }
            }
        ]);

        const totalBytes = totalSpace[0]?.totalDataUsed || 0;
        const totalGB = totalBytes / (1024 * 1024 * 1024);

        console.log(watched);


        return res.status(200).json({
            ok: true,
            userCount,
            movieCount,
            employeeCount,
            userPerMonth,
            latestWatched: watched,
            totalData: 15,
            usedData: totalGB,
        })

    } catch (error) {
        console.error("Create Employee Error:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error"
        });
    }
}

exports.createEmployee = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            password,
            post,
            department,
            address,
            salary,
            dob,          // DD-MM-YYYY
            aadharNo,
            panNo,
            role,
        } = req.body;

        /* -------------------- Required Fields -------------------- */
        const requiredFields = {
            name,
            phone,
            email,
            password,
            department,
            post,
            address,
            salary,
            dob,
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([_, value]) => !value)
            .map(([key]) => key);

        if (missingFields.length > 0) {
            return res.status(400).json({
                ok: false,
                message: `Missing required fields: ${missingFields.join(", ")}`
            });
        }

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }

        const [type, token] = authHeader.split(" ");

        if (type !== "Bearer" || !token) {
            return res.status(401).json({ message: "Invalid auth format" });
        }

        if (!token) {
            return res.status(401).json({
                ok: false,
                code: "INVALID_TOKEN",
                message: "Unauthorised Access"
            });
        }

        let decodedToken;
        let adminId;

        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            adminId = decodedToken.empId;
        } catch (err) {
            console.log(err.name);

            if (err.name === "TokenExpiredError") {
                return res.status(401).json({
                    ok: false,
                    code: "TOKEN_EXPIRED",
                    message: "Session expired. Please login again."
                });
            }

            return res.status(401).json({
                ok: false,
                code: "INVALID_TOKEN",
                message: "Invalid authentication token."
            });
        }

        let isAdmin = await Employee.findOne({
            empId: adminId,
            $or: [
                { role: "admin" },
                {
                    role: "employee",
                    adminAccessEnd: { $gt: new Date() }
                }
            ]
        });

        if (!isAdmin) {
            return res.status(403).json({
                ok: false,
                message: `Unathorised Access !`
            });
        }


        /* -------------------- Email Validation -------------------- */
        if (!validateEmail(email)) {
            return res.status(400).json({ ok: false, message: "Invalid email address" });
        }

        /* -------------------- Existing Employee -------------------- */
        const employeeExists = await Employee.exists({ email });
        if (employeeExists) {
            return res.status(409).json({ ok: false, message: "Employee already exists" });
        }

        /* -------------------- Phone Validation -------------------- */
        if (!/^[0-9]{10}$/.test(phone)) {
            return res.status(400).json({ ok: false, message: "Phone number must be 10 digits" });
        }

        /* -------------------- Aadhaar Validation -------------------- */
        if (aadharNo && !/^[0-9]{12}$/.test(aadharNo)) {
            return res.status(400).json({ ok: false, message: "Invalid Aadhaar number" });
        }

        /* -------------------- PAN Validation -------------------- */
        if (panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNo)) {
            return res.status(400).json({ ok: false, message: "Invalid PAN number" });
        }

        /* -------------------- Salary Validation -------------------- */
        const salaryNum = Number(salary);
        if (Number.isNaN(salaryNum) || salaryNum < 0) {
            return res.status(400).json({ ok: false, message: "Invalid salary amount" });
        }

        /* -------------------- DOB & Age -------------------- */
        const dobDate = convertDDMMYYToISO(dob);
        if (!dobDate) {
            return res.status(400).json({ ok: false, message: "Invalid date of birth format" });
        }

        const age = getAgeFromDOB(dob);
        if (age < 14 || age > 100) {
            return res.status(400).json({ ok: false, message: "Invalid employee age" });
        }

        /* -------------------- Employee ID -------------------- */
        const empId = `EMP${Date.now().toString().slice(-8)}`;

        if (role) {
            if (role != "admin" && role != "employee") {
                return res.status(400).json({ ok: false, message: "Invalid role type." });
            }
        }

        /* -------------------- Create Employee -------------------- */
        const employee = new Employee({
            name,
            phone: Number(phone),
            email,
            password: password,
            post,
            address,
            department,
            salary: salaryNum,
            age,
            dob: dobDate,
            aadharNo: aadharNo || undefined,
            panNo: panNo?.trim() || undefined,
            joiningDate: new Date(),
            empId,
            role: role || "employee"
        });

        await employee.save();

        return res.status(201).json({
            ok: true,
            message: "Employee created successfully",
            data: employee
        });

    } catch (error) {
        console.error("Create Employee Error:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error"
        });
    }
};


exports.updateEmployee = async (req, res) => {
    try {
        const { empId } = req.params;

        let updated = await Employee.findOneAndUpdate(
            { empId },
            { $set: req.body },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ ok: false, message: "Employee not found" });
        }

        return res.status(200).json({ ok: true, message: "Employee updated", data: updated });

    } catch (error) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};


exports.deleteEmployee = async (req, res) => {
    try {
        const { empId } = req.params;

        let deleted = await Employee.findOneAndDelete({ empId });

        if (!deleted) {
            return res.status(404).json({ ok: false, message: "Employee not found" });
        }

        return res.status(200).json({ ok: true, message: "Employee deleted" });

    } catch (error) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};


exports.fetchEmployees = async (req, res) => {
    try {
        let employees = await Employee.find().lean();

        return res.status(200).json({ ok: true, data: employees });

    } catch (error) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};


exports.makeAdmin = async (req, res) => {
    try {
        const { empId } = req.params;

        let updated = await Employee.findOneAndUpdate(
            { empId },
            { role: "admin", adminAccessStart: null, adminAccessEnd: null },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ ok: false, message: "Employee not found" });
        }

        return res.status(200).json({ ok: true, message: "Admin access granted", data: updated });

    } catch (error) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};


exports.removeAdmin = async (req, res) => {
    try {
        const { empId } = req.params;

        let updated = await Employee.findOneAndUpdate(
            { empId },
            { role: "employee", adminAccessStart: null, adminAccessEnd: null },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ ok: false, message: "Employee not found" });
        }

        return res.status(200).json({ ok: true, message: "Admin access removed", data: updated });

    } catch (error) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};


exports.giveAdminAccessForPeriod = async (req, res) => {
    try {
        const { empId } = req.params;
        const { startDate, endDate } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({ ok: false, message: "Start and end date required" });
        }

        let updated = await Employee.findOneAndUpdate(
            { empId },
            {
                role: "admin",
                adminAccessStart: new Date(startDate),
                adminAccessEnd: new Date(endDate)
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ ok: false, message: "Employee not found" });
        }

        return res.status(200).json({ ok: true, message: "Temporary admin access granted", data: updated });

    } catch (error) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



exports.removeAdminAccessPeriod = async (req, res) => {
    try {
        const { empId } = req.params;

        let updated = await Employee.findOneAndUpdate(
            { empId },
            { adminAccessStart: null, adminAccessEnd: null },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ ok: false, message: "Employee not found" });
        }

        return res.status(200).json({ ok: true, message: "Admin period removed", data: updated });

    } catch (error) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};


exports.fetchUsers = async (req, res) => {
    try {

        let userList = await User.find({ status: { $ne: "deleted" } })
            .limit(100)
            .lean();

        return res.status(200).json({ ok: true, userList });

    } catch (error) {
        return res.status(500).json({ ok: false, message: error.message });

    }
}


exports.addMovie = async (req, res) => {
    try {
        const { title, bio, year, genre, rating, director, language, cast, image, video, token, mediaSize } = req.body;

        console.log(image);


        if (
            !title ||
            !bio ||
            !year ||
            !genre ||
            rating === undefined ||
            !director ||
            !Array.isArray(language) ||
            language.length === 0 ||
            !cast ||
            !token || !mediaSize
        ) {
            return res.status(400).json({ ok: false, message: "Missing fields!" });
        }

        const yearNum = Number(year);

        if (
            !Number.isInteger(yearNum) ||
            yearNum < 1888 ||
            yearNum > new Date().getFullYear() + 1
        ) {
            return res.status(400).json({ ok: false, message: "Invalid movie release year" });
        }

        const ratingNum = Number(rating);

        if (
            Number.isNaN(ratingNum) ||
            ratingNum < 0 ||
            ratingNum > 10
        ) {
            return res.status(400).json({ ok: false, message: "Invalid rating!" });
        }

        const finalRating = Number(ratingNum.toFixed(1));

        const castArray = [
            ...new Set(
                cast
                    .split(",")
                    .map(n => n.trim().toLowerCase())
                    .filter(Boolean)
            )
        ];

        const normalizedTitle = title.trim();
        const normalizedDirector = director.trim().toLowerCase();

        const movieExists = await Movie.exists({
            title: normalizedTitle,
            year: yearNum,
            director: normalizedDirector,
        });

        if (movieExists) {
            return res.status(400).json({ ok: false, message: "Movie already exists!" });
        }

        const movie = new Movie({
            title: normalizedTitle,
            bio: bio.trim(),
            genre,
            rating: finalRating,
            director: normalizedDirector,
            cast: castArray,
            language,
            year: yearNum,
            mediaSize: Number(mediaSize),
        });

        let movieData = await movie.save();

        let imageUploadCred = await getUploadUrl({ contentType: image, fileName: movieData._id })

        console.log("Image-Upload: ", imageUploadCred);


        let videoUploadCred = await cloudinaryVideoUploadURL(movieData._id,);

        console.log("Video-Upload: ", videoUploadCred);

        return res.status(201).json({
            ok: true,
            message: "Movie added successfully",
            movieData,
            imgUploadCred: imageUploadCred,
            videoUploadCred: videoUploadCred
        });

    } catch (error) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};

exports.updateMovieData = async (req, res) => {
    try {

        const { movieId, title, bio, year, genre, rating, director, language, cast, token } = req.body;

        if (
            !movieId ||
            !title ||
            !bio ||
            !year ||
            !genre ||
            rating === undefined ||
            !director ||
            !Array.isArray(language) ||
            language.length === 0 ||
            !cast ||
            !token
        ) {
            return res.status(400).json({ ok: false, message: "Missing fields!" });
        }

        const yearNum = Number(year);

        if (
            !Number.isInteger(yearNum) ||
            yearNum < 1888 ||
            yearNum > new Date().getFullYear() + 1
        ) {
            return res.status(400).json({ ok: false, message: "Invalid movie release year" });
        }

        const ratingNum = Number(rating);

        if (
            Number.isNaN(ratingNum) ||
            ratingNum < 0 ||
            ratingNum > 5
        ) {
            return res.status(400).json({ ok: false, message: "Invalid rating!" });
        }

        const finalRating = Number(ratingNum.toFixed(1));

        const castArray = [
            ...new Set(
                cast
                    .split(",")
                    .map(n => n.trim().toLowerCase())
                    .filter(Boolean)
            )
        ];

        const normalizedTitle = title.trim();
        const normalizedDirector = director.trim().toLowerCase();

        const movieExists = await Movie.exists({
            _id: movieId,
        });

        console.log(movieId);


        if (!movieExists) {
            return res.status(400).json({ ok: false, message: "Movie don't exists!" });
        }

        const updateMovie = await Movie.findByIdAndUpdate(movieId, {
            title: normalizedTitle,
            bio: bio.trim(),
            genre,
            rating: finalRating,
            director: normalizedDirector,
            cast: castArray,
            language,
            year: yearNum,
        }, { new: true });

        if (!updateMovie) {
            return res.status(400).json({ ok: false, message: "Movie doesn't exists!" });
        }

        return res.status(200).json({ ok: true, data: updateMovie })

    } catch (error) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};

exports.updateMovieMedia = async (req, res) => {
    try {

        const { image, video, token, movieId } = req.body;

        console.log("I was called");


        if (!token || !movieId) {
            return res.status(400).json({ ok: false, message: "Data not given !" });
        }

        let imageUploadCred = null;
        let videoUploadCred = null;


        if (image) {
            imageUploadCred = await getUploadUrl({ contentType: image, fileName: movieId })
        }

        if (video) {
            videoUploadCred = await cloudinaryVideoUploadURL(movieId);
        }

        console.log("ImageCred: ", imageUploadCred);


        return res.status(201).json({
            ok: true,
            message: "Movie added successfully",
            imgUploadCred: imageUploadCred,
            videoUploadCred: videoUploadCred
        });
    } catch (error) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};

exports.recordMedia = async (req, res) => {
    try {

        const { imgURL, videoURL, movieId, token, duration } = req.body;

        console.log("Duration: ",duration);
        

        if (!imgURL || !videoURL || !movieId || !token || !duration) {
            return res.status(400).json({ ok: false, message: "Missing fields!" });
        }

        let parsedDuration = Number(duration);

        let movie = await Movie.findByIdAndUpdate(movieId, {
            image: imgURL,
            videoUrl: videoURL,
            duration: parsedDuration*1000
        }).lean();

        if (!movie) {
            return res.status(400).json({ ok: false, message: "Movie doesn't exists!" });
        }

        return res.status(200).json({ ok: true, message: "Media recorded successfully!" })


    } catch (error) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};

exports.recordUpdatedMedia = async (req, res) => {
    try {

        const { imgURL, videoURL, movieId, token } = req.body;

        if (!movieId || !token) {
            return res.status(400).json({ ok: false, message: "Missing fields!" });
        }

        let movie = null;

        if (imgURL != "" && videoURL != "") {

            movie = await Movie.findByIdAndUpdate(movieId, {
                image: imgURL,
                videoUrl: videoURL
            }).lean();
        }

        else if (imgURL != "") {
            movie = await Movie.findByIdAndUpdate(movieId, {
                image: imgURL
            }).lean();
        }
        else if (videoURL != "") {
            movie = await Movie.findByIdAndUpdate(movieId, {
                videoUrl: videoURL
            }).lean();
        }


        if (!movie) {
            return res.status(400).json({ ok: false, message: "Movie doesn't exists!" });
        }

        return res.status(200).json({ ok: true, message: "Media recorded successfully!" })


    } catch (error) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};

exports.deleteMovie = async (req, res) => {
    try {

        const { movieId, token } = req.body;
        console.log("Delete movie is called");

        if (!movieId || !token) {
            return res.status(200).json({ ok: false, message: "Invalid data !" });
        }

        let movie = await Movie.findById(movieId).lean();

        if (!movie) {
            return res.status(200).json({ ok: false, message: "Movie doesn't exist !" });
        }

        let imageURL = movie.image;
        let deleteImage;

        if (imageURL && imageURL != "") {
            deleteImage = await deleteFromS3(imageURL);
            if (!deleteImage) {
                return res.status(403).json({ ok: false, message: "Image couldn't be deleted!" })
            }
        }

        console.log("Deleted image Data :", deleteImage);


        let videoURL = movie.videoUrl;
        let deleteVideo;

        if (videoURL && videoURL != "") {
            deleteVideo = await deleteFromCloudinary(videoURL);
            if (!deleteVideo) {
                return res.status(403).json({ ok: false, message: "Video couldn't be deleted!" })
            }
        }
        console.log("Deleted video Data :", deleteVideo);

        let deleted = !!(await Movie.findByIdAndDelete(movieId));

        if (!deleted) {
            return res.status(403).json({ ok: false, message: "Media removed but Data couldn't be deleted." })
        }



        return res.status(200).json({ ok: true, message: "Movie deleted !" });

    } catch (error) {
        return res.status(500).json({ ok: false, message: error.message });
    }
}

exports.deleteUser = async (req, res) => {
    try {

        const { userId } = req.body;

        const authHeader = req.headers.authorization;
        let isValid = await AuthValid(authHeader);

        if (!isValid.ok) {
            return res.status(403).json(isValid);
        }

        let userExists = await User.exists({ _id: userId });

        if (!userExists) {
            return res.status(400).json({ ok: false, message: "User don't exists." });
        }

        let deletedUser = await User.findByIdAndUpdate(userId, {
            status: "deleted",
        });

        if (!deletedUser) {
            return res.status(400).json({ ok: false, message: "User couldn't be deleted." });
        }

        return res.status(200).json({ ok: true, message: "User deleted successfully." });

    } catch (error) {
        return res.status(500).json({ ok: false, message: error.message });
    }
}