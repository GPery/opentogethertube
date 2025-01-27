const express = require("express");
import { v4 as uuidv4 } from "uuid";
import InfoExtract from "./infoextractor";
const { getLogger } = require("./logger.js");
import roommanager from "./roommanager";
import { consumeRateLimitPoints } from "./rate-limit";
import roomapi from "./api/room";
import { redisClient } from "./redisclient";
import { ANNOUNCEMENT_CHANNEL } from "../common/constants";
import auth from "./auth";
import usermanager from "./usermanager";
import passport from "passport";
import statusapi from "./api/status";
import { getApiKey } from "./admin";
import { conf } from "./ott-config";

const log = getLogger("api");

const router = express.Router();

router.use("/auth", auth.router);
router.use("/status", statusapi);
router.use((req, res, next) => {
	// eslint-disable-next-line no-unused-vars
	passport.authenticate("bearer", (err, user, info) => {
		// We are intentionally ignoring the case where authentication fails, because
		// we want to allow users who are not logged in to an actual account to
		// be able to use the website.

		// log.error(`bearer auth error: ${err}`);
		if (err) {
			next(err);
			return;
		}
		// log.debug(`bearer auth user: ${user}`);
		// log.debug(`bearer auth info: ${info}`);
		next();
	})(req, res, next);
});
router.use(auth.authTokenMiddleware);
router.use("/user", usermanager.router);
router.use("/room", roomapi);

if (conf.get("env") === "development") {
	(async () => {
		router.use("/dev", (await import("./api/dev")).default);
	})();
}

router.post("/room/generate", async (req, res) => {
	let points = 50;
	if (!(await consumeRateLimitPoints(res, req.ip, points))) {
		return;
	}
	let roomName = uuidv4();
	log.debug(`Generating room: ${roomName}`);
	await roommanager.createRoom({
		name: roomName,
		isTemporary: true,
	});
	log.info(`room generated: ip=${req.ip} user-agent=${req.headers["user-agent"]}`);
	res.json({
		success: true,
		room: roomName,
	});
});

router.get("/data/previewAdd", async (req, res) => {
	let points = 5;
	if (!InfoExtract.isURL(req.query.input)) {
		points *= 15;
	}
	if (!(await consumeRateLimitPoints(res, req.ip, points))) {
		return;
	}
	try {
		log.info(`Getting queue add preview for ${req.query.input}`);
		let result = await InfoExtract.resolveVideoQuery(
			req.query.input.trim(),
			conf.get("add_preview.search.provider")
		);
		res.json(result);
		log.info(`Sent add preview response with ${result.length} items`);
	} catch (err) {
		if (
			err.name === "UnsupportedServiceException" ||
			err.name === "InvalidAddPreviewInputException" ||
			err.name === "OutOfQuotaException" ||
			err.name === "InvalidVideoIdException" ||
			err.name === "FeatureDisabledException" ||
			err.name === "UnsupportedMimeTypeException" ||
			err.name === "LocalFileException" ||
			err.name === "MissingMetadataException" ||
			err.name === "UnsupportedVideoType" ||
			err.name === "VideoNotFoundException"
		) {
			log.error(`Unable to get add preview: ${err.name}`);
			res.status(400).json({
				success: false,
				error: {
					name: err.name,
					message: err.message,
				},
			});
		} else {
			log.error(`Unable to get add preview: ${err} ${err.stack}`);
			res.status(500).json({
				success: false,
				error: {
					name: "Unknown",
					message: "Unknown error occurred.",
				},
			});
		}
	}
});

router.post("/announce", (req, res) => {
	if (req.get("apikey")) {
		if (req.get("apikey") !== getApiKey()) {
			res.status(400).json({
				success: false,
				error: "apikey is invalid",
			});
			return;
		}
	} else {
		res.status(400).json({
			success: false,
			error: "apikey was not supplied",
		});
		return;
	}
	if (!req.body.text) {
		res.status(400).json({
			success: false,
			error: "text was not supplied",
		});
		return;
	}

	try {
		redisClient.publish(
			ANNOUNCEMENT_CHANNEL,
			JSON.stringify({
				action: "announcement",
				text: req.body.text,
			})
		);
	} catch (error) {
		log.error(`An unknown error occurred while sending an announcement: ${error}`);
		res.status(500).json({
			success: false,
			error: {
				name: "Unknown",
				message: "Unknown, check logs",
			},
		});
		return;
	}
	res.json({
		success: true,
	});
});

export default router;
