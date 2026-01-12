const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Movie = require('../db/models/movie');
const User = require('../db/models/user');
const Watched = require('../db/models/watched');
dotenv.config();

exports.getMovieList = async (req, res) => {
    try {

        console.log("Called !");


        let date = new Date();
        let year = date.getFullYear();

        let newMovieList = await Movie.find({ image: { $exists: true, $ne: "" }, videoUrl: { $exists: true, $ne: "" }, year: { $gte: year } }).select('title bio year image genre rating language duration').limit(50).sort({ createdAt: -1 }).lean();

        let bestMovieList = await Movie.find({ image: { $exists: true, $ne: "" }, videoUrl: { $exists: true, $ne: "" }, rating: { $gt: 7 } }).select('title bio year image genre rating language duration').limit(50).sort({ createdAt: -1 }).lean();

        let bestSeriesList = await Movie.find({ image: { $exists: true, $ne: "" }, videoUrl: { $exists: true, $ne: "" }, type: "series", rating: { $gt: 7 } }).select('title bio year image genre rating language duration').limit(50).sort({ createdAt: -1 }).lean();

        // console.log("Best-Movies: ", bestMovieList);
        // console.log("New-Movies: ", newMovieList);
        // console.log("Best-Series: ", bestSeriesList);


        res.status(200).json({ ok: true, bestMovieList, newMovieList, bestSeriesList })


    } catch (error) {
        res.status(500).json({ ok: false, message: error.message })
    }
}
exports.getAllMovies = async (req, res) => {
    try {

        let movieList = await Movie.find({ image: { $exists: true, $ne: "" }, videoUrl: { $exists: true, $ne: "" } }).select('title bio year image genre rating language duration').limit(50).sort({ createdAt: -1 }).lean();

        res.status(200).json({ ok: true, movieList })

    } catch (error) {
        res.status(500).json({ ok: false, message: error.message })
    }
}
exports.getMovieListAdmin = async (req, res) => {
    try {


        let movieList = await Movie.aggregate([
            {
                $sort: { createdAt: -1 }
            },
            {
                $lookup: {

                    from: "watcheds",
                    let: { movieId: { $toString: "$_id" } },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$movieId", "$$movieId"] }
                            }
                        }
                    ],
                    as: "watch"
                }
            },
            {
                $addFields: {
                    watched: { $size: "$watch" }
                }
            },
            {
                $project: {
                    title: 1,
                    year: 1,
                    genreL: 1,
                    upBy: 1,
                    rating: 1,
                    watched: 1
                }
            }

        ]);


        res.status(200).json({ ok: true, data: movieList })


    } catch (error) {
        res.status(500).json({ ok: false, message: error.message })
    }
}
exports.getMovieListByGenre = async (req, res) => {
    try {

        console.log("Came till here ?");


        const { genre } = req.query;
        console.log(genre);


        if (!genre || genre.trim() === "") {
            return res.json({ ok: false, message: "Empty genre" });
        }

        let movieList = await Movie.find({ genre: { $in: [genre] } })
            .select('title bio year image genre rating language duration')
            .limit(50)
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ ok: true, data: movieList })


    } catch (error) {
        res.status(500).json({ ok: false, message: error.message })
    }
}
exports.getMovieListBySearch = async (req, res) => {
    try {

        const { keyword } = req.query;

        if (!keyword || keyword.trim() === "") {
            return res.json({ ok: false, message: "Empty keyword" });
        }

        const movieList = await Movie.find({
            $or: [
                { title: { $regex: keyword, $options: "i" } },
                { bio: { $regex: keyword, $options: "i" } }
            ]
        })
            .select('title bio year image genre rating language duration')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        res.status(200).json({ ok: true, data: movieList })


    } catch (error) {
        res.status(500).json({ ok: false, message: error.message })
    }
}
exports.getMovieListByLanguage = async (req, res) => {
    try {

        console.log("Came till here ?");


        const { language } = req.query;
        console.log(language);


        if (!language || language.trim() === "") {
            return res.json({ ok: false, message: "Empty language" });
        }

        let movieList = await Movie.find({ language: { $in: [language] } })
            .select('title bio year image genre rating language duration')
            .limit(50)
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ ok: true, data: movieList })


    } catch (error) {
        res.status(500).json({ ok: false, message: error.message })
    }
}
exports.fetchMovieData = async (req, res) => {
    try {

        const { movieId } = req.query;

        if (!movieId || movieId.trim() === "") {
            return res.json({ ok: false, message: "Invalid movie" });
        }

        let movieData = await Movie.findById(movieId).lean();

        if (!movieData) {
            return res.json({ ok: false, message: "Invalid movie" });
        }

        res.status(200).json({ ok: true, data: movieData })


    } catch (error) {
        res.status(500).json({ ok: false, message: error.message })
    }
}
exports.fetchMovieDataClient = async (req, res) => {
    try {

        const { movieId } = req.query;

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ ok: false, message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        // console.log(token);


        if (!token) {
            return res.status(403).json({ ok: false, messages: "Unautorised Accesss" });
        }

        if (!movieId || movieId.trim() === "") {
            return res.json({ ok: false, message: "Invalid movie" });
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

        let movieData = await Movie.findById(movieId).lean();

        if (!movieData) {
            return res.json({ ok: false, message: "Invalid movie" });
        }

        res.status(200).json({ ok: true, data: movieData })


    } catch (error) {
        res.status(500).json({ ok: false, message: error.message })
    }
}
exports.fetchMovieURL = async (req, res) => {
    try {

    } catch (error) {
        res.status(500).json({ ok: false, message: error.message })
    }
}

exports.updateMovie = async (req, res) => {
    try {

        const { data } = req.body;

        if (!data || typeof data !== "object") {
            return res.status(400).json({ ok: false, message: "Missing data!" });
        }




    } catch (error) {
        res.status(500).json({ ok: false, message: error.message })
    }
}

exports.createWatchedData = async (req, res) => {
    try {

        const { movieId, token, duration, adsCount } = req.body;

        if (!movieId || !token || !duration || !adsCount) {
            return res.status(400).json({ ok: false, message: "Missing data fields" });
        }

        // let decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        // let userId = decodedToken.userId;

        let userId = token;

        let userExists = await User.exists({ _id: userId });
        if (!userExists) {
            return res.status(400).json({ ok: false, message: "Invalid access" });
        }

        let movieExists = await Movie.exists({ _id: movieId });
        if (!movieExists) {
            return res.status(400).json({ ok: false, message: "Invalid movie" });
        }

        let watchedDoc = new Watched({
            userId,
            movieId,
            duration: Number(duration),
            adsWatched: Number(adsCount)
        })

        let watchedData = await watchedDoc.save();

        return res.status(200).json({ ok: true, message: "Watched document created.", data: watchedData });


    } catch (error) {
        res.status(500).json({ ok: false, message: error.message })
    }
}