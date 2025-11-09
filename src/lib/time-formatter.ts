type TimeFormat = "24hour" | "thai";

export function formatTime(time: string, format?: TimeFormat): string {
	const timeFormat = format || (localStorage.getItem("timeFormat") as TimeFormat) || "thai";
	const normalizedTime = time.replace(".", ":");

	if (/^\d{2}:\d{2}$/.test(normalizedTime)) {
		if (timeFormat === "24hour") {
			return normalizedTime;
		}
		return convertToThaiTime(normalizedTime);
	}

	const date = new Date(normalizedTime);
	const hours = date.getHours();
	const minutes = date.getMinutes();
	const timeString = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

	if (timeFormat === "24hour") {
		return timeString;
	}

	return convertToThaiTime(timeString);
}

function convertToThaiTime(time: string): string {
	const [hh, mm] = time.split(":");
	const hours = Number(hh ?? "0");
	const minutes = Number(mm ?? "0");

	if (hours === 12 && minutes === 0) {
		return "เที่ยง";
	}

	let result = "";

	if (hours >= 6 && hours < 12) {
		result = `${hours} โมง`;
		if (minutes === 0) result += "เช้า";
	} else if (hours === 12) {
		result = "เที่ยง";
	} else if (hours >= 13 && hours < 16) {
		const thaiHour = hours - 12;
		result = thaiHour === 1 ? "บ่ายโมง" : `บ่าย ${thaiHour} โมง`;
	} else if (hours >= 16 && hours < 18) {
		const thaiHour = hours - 12;
		result = `${thaiHour} โมง`;
		if (minutes === 0) result += "เย็น";
	} else if (hours >= 18 && hours < 24) {
		const thaiHour = hours - 12;
		result = `${thaiHour} โมง`;
	} else if (hours >= 0 && hours < 6) {
		result = hours === 0 ? "เที่ยงคืน" : `ตี ${hours}`;
	}

	if (minutes > 0) {
		result += minutes === 30 ? "ครึ่ง" : ` ${minutes} นาที`;
	}

	return result;
}

export function getTimeFormat(): TimeFormat {
	return (localStorage.getItem("timeFormat") as TimeFormat) || "thai";
}
