import { google, youtube_v3 } from "googleapis";
import { get } from "lodash";
import fs from "fs";
import path from "path";
import { Tokens } from "../types/app";
import { Message } from "discord.js";

const tokens: Tokens = JSON.parse(
	fs.readFileSync(path.resolve(process.cwd() + "/tokens.json"), {
		encoding: "utf8",
	})
);

const oauth2Client = new google.auth.OAuth2(
	process.env.GOOGLE_OAUTH_CLIENT_ID,
	process.env.GOOGLE_OAUTH_CLIENT_SECRET,
	"http://localhost:3000"
);

oauth2Client.setCredentials(tokens);

const yt = google.youtube({ version: "v3", auth: oauth2Client });

function formatVideoData(video: youtube_v3.Schema$Video) {
	const likes = parseInt(video.statistics?.likeCount || "0", 10);

	const dislikes = parseInt(video.statistics?.dislikeCount || "0", 10);

	const total = likes + dislikes;

	const ratio = Math.round((likes / total) * 100 * 10) / 10;

	const views = parseInt(video.statistics?.viewCount || "0", 10).toLocaleString("en-us");

	const title = video.snippet?.title;

	const commentCount = video.statistics?.commentCount;

	let result = [
		{ name: "title", msg: `🔮 Title: ${title}` },
		{ name: "likes", msg: `👍 Likes: ${likes}` },
		{ name: "dislikes", msg: `👎 Dislikes: ${dislikes}` },
		{ name: "ratio", msg: `📈 Ratio: ${ratio}` },
		{ name: "views", msg: `👀 Views: ${views}` },
		{ name: "commentCount", msg: `💬 Comments: ${commentCount}` },
		{ name: "link", msg: `https://youtube.com/watch?v=${video.id}` },
	];

	if (isNaN(ratio)) {
		/**
		 * These fields can be disabled by the video author,
		 * if they are, change the field msg.
		 */
		const disabled = ["likes", "dislikes", "ratio"];

		result = result.map((el) =>
			disabled.includes(el.name)
				? { ...el, msg: `${el.msg.split(": ")[0]}: Disabled by the video creator` }
				: el
		);
	}

	return result;
}

export async function getVideoStats({
	videoId,
	isReplyToMessage = false,
}: {
	videoId: string;
	isReplyToMessage?: boolean;
}) {
	const { data } = await yt.videos.list({
		part: ["snippet", "statistics"],
		id: [videoId],
	});
  
	if (!data.items) return `Could not find a video with the id ${videoId}`;

	const video = data?.items[0];

	if (!video) {
		return `Could not find video with ID ${videoId}. Copy the ID from the video URL.`;
	}

	const formatted = formatVideoData(video);

	return generateMessage(formatted, isReplyToMessage);
}

const ytVideoRegExp =
	/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;

const generateMessage = (data: ReturnType<typeof formatVideoData>, isReply: boolean) => {
	const stats = isReply ? data.filter((el) => el.name !== "link") : data;
	const message = stats.map((el) => el.msg).join(`\n\n`);

	return message;
};

export function getVideoIdFromYtUrl(url: string): string | null {
	try {
		const u = new URL(url);

		const searchParams = new URLSearchParams(u.searchParams);

		if (searchParams.has("v")) {
			return searchParams.get("v");
		}
	} catch (e) {}

	const match = url.match(ytVideoRegExp);

	if (match && match[7].length == 11) {
		return match[7];
	}

	return null;
}

export function getVideoIdFromMessage({ message }: { message: Message }): string | null {
	const embeddedUrl = get(message, "embeds[0].url");

	if (embeddedUrl) {
		return getVideoIdFromYtUrl(embeddedUrl);
	}

	const { content } = message;

	if (content.startsWith("https://youtu.be/") || content.startsWith("https://www.youtu")) {
		return getVideoIdFromYtUrl(message.content);
	}

	// Try avoid using the regex
	if (ytVideoRegExp.test(content)) {
		return getVideoIdFromYtUrl(message.content);
	}

	return null;
}
