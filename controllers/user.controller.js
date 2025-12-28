const User = require('../db/models/user');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Watched = require('../db/models/watched');
dotenv.config();


function validateFields(body, requiredFields) {
    for (let field of requiredFields) {
        if (
            body[field] === undefined ||
            body[field] === null ||
            body[field] === "" ||
            (Array.isArray(body[field]) && body[field].length === 0)
        ) {
            return field;
        }
    }
    return null;
}

exports.getWatchHistory = async (req, res) => {
    try {
        console.log("Got called");

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ ok: false, message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        console.log(token);


        if (!token) {
            return res.status(403).json({ ok: false, messages: "Unautorised Accesss" });
        }

        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ ok: false, message: "Invalid or expired token" });
        }

        let userId = decodedToken.userId;

        let userExists = await User.exists({ _id: userId });

        if (!userExists) {
            return res.status(400).json({ ok: false, message: "Invalid Access" });
        }

        const watched = await Watched.aggregate([
            {
                $match: {
                    userId: userId
                }
            },

            {
                $addFields: {
                    movieObjId: { $toObjectId: "$movieId" }
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
                $project: {
                    _id: "$movie._id",
                    title: "$movie.title",
                    image: "$movie.image",
                    bio: "$movie.bio",
                    rating: "$movie.rating",
                    duration: "$movie.duration",
                    watchedDuration: "$duration"
                }
            },

            { $limit: 50 }
        ]);

        console.log(watched);

        res.status(200).json({ ok: true, message: "Watch history retireved", data: watched });

    } catch (error) {
        res.status(500).json({ ok: false, message: error.message })
    }
}


exports.updateMovieWatched = async (req, res) => {
    try {
        console.log("I was called");

        const { duration, token, movieId } = req.body;

        console.log("Duration: ", duration);


        if (!token) {
            return res.status(403).json({ ok: false, messages: "Unautorised Accesss" });
        }

        if (!movieId || movieId.trim() === "" || !duration) {
            return res.status(400).json({ ok: false, message: "Invalid movie" });
        }

        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ ok: false, message: "Invalid or expired token" });
        }

        let userId = decodedToken.userId;

        let userExists = await User.exists({ _id: userId });

        if (!userExists) {
            return res.status(400).json({ ok: false, message: "Invalid Access" });
        }

        const parsed = Number(duration);
        console.log("Type of Duration: ", typeof parsed);

        if (typeof parsed != "number") {
            return res.status(400).json({ ok: false, message: "Invalid Duration" });
        }

        await Watched.findOneAndUpdate({
            userId: userId,
            movieId: movieId
        }, {
            duration: parsed
        }, {
            upsert: true,
        })

        return res.status(200).json({ ok: true, message: "Watch History Updated" })

    } catch (error) {
        res.status(500).json({ ok: false, message: error.message })
    }
}
