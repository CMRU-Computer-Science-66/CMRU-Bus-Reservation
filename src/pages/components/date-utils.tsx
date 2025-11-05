export const formatThaiDate = (isoDate: string | Date) => {
	const date = new Date(isoDate);
	const thaiDays = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
	const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

	const dayName = thaiDays[date.getDay()];
	const day = date.getDate();
	const month = thaiMonths[date.getMonth()];
	const year = date.getFullYear() + 543;

	return `วัน${dayName}ที่ ${day} ${month} ${year}`;
};

export const formatThaiDateShort = (isoDate: string | Date) => {
	const date = new Date(isoDate);
	const thaiDays = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
	const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

	const dayName = thaiDays[date.getDay()];
	const day = date.getDate();
	const month = thaiMonths[date.getMonth()];

	return `${dayName} ${day} ${month}`;
};

export const formatTime = (date: Date | string) => {
	const d = new Date(date);
	const hours = String(d.getHours()).padStart(2, "0");
	const minutes = String(d.getMinutes()).padStart(2, "0");
	return `${hours}:${minutes}`;
};

export const getRelativeDay = (dateString: string | Date) => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const targetDate = new Date(dateString);
	targetDate.setHours(0, 0, 0, 0);

	const diffTime = targetDate.getTime() - today.getTime();
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return "วันนี้";
	if (diffDays === 1) return "พรุ่งนี้";
	if (diffDays === 2) return "มะรืนนี้";
	if (diffDays > 2 && diffDays <= 7) return `อีก ${diffDays} วัน`;
	if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} วันที่แล้ว`;
	return null;
};
