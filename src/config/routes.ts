export const BASE_URL = "https://cmru-bus.vercel.app";

export const ROUTES = {
	HOME: "/",
	LOGIN: "/login",
	SCHEDULE: "/schedule",
	BOOKING: "/booking",
	SETTINGS: "/settings",
	STATISTICS: "/statistics",
} as const;

export const EXTERNAL_URLS = {
	GITHUB_REPO: "https://github.com/CMRU-Computer-Science-66/CMRU-Bus-Reservation",
	GITHUB_ORG: "https://github.com/CMRU-Computer-Science-66",
	API_REPO: "https://github.com/CMRU-Computer-Science-66/CMRU-API",
	CMRU_WEBSITE: "https://www.cmru.ac.th",
} as const;

export const ROUTE_METADATA = {
	[ROUTES.HOME]: {
		title: "CMRU Bus - มหาวิทยาลัยราชภัฏเชียงใหม่",
		description: "CMRU Bus - ระบบจองรถรับส่ง มหาวิทยาลัยราชภัฏเชียงใหม่ จองรถรับส่งนักศึกษาและบุคลากรได้อย่างสะดวกรวดเร็ว",
		priority: 1,
		frequency: "daily" as const,
	},
	[ROUTES.LOGIN]: {
		title: "เข้าสู่ระบบ - ระบบจองรถบัส CMRU",
		description: "เข้าสู่ระบบจองรถบัส มหาวิทยาลัยราชภัฏเชียงใหม่ ด้วย CMU Account",
		priority: 0.8,
		frequency: "weekly" as const,
	},
	[ROUTES.SCHEDULE]: {
		title: "รายการจองรถบัส - ระบบจองรถบัส CMRU",
		description: "ดูรายการจองรถบัสทั้งหมดของคุณ มหาวิทยาลัยราชภัฏเชียงใหม่",
		priority: 0.9,
		frequency: "daily" as const,
	},
	[ROUTES.BOOKING]: {
		title: "จองรถบัส - ระบบจองรถบัส CMRU",
		description: "จองรถบัสสำหรับเดินทางระหว่างวิทยาเขตแม่ริมและเวียงบัว มหาวิทยาลัยราชภัฏเชียงใหม่",
		priority: 0.9,
		frequency: "daily" as const,
	},
	[ROUTES.SETTINGS]: {
		title: "ตั้งค่า - ระบบจองรถบัส CMRU",
		description: "จัดการการตั้งค่าและข้อมูลส่วนตัว ระบบจองรถบัส มหาวิทยาลัยราชภัฏเชียงใหม่",
		priority: 0.5,
		frequency: "weekly" as const,
	},
	[ROUTES.STATISTICS]: {
		title: "สถิติการเดินทาง - ระบบจองรถบัส CMRU",
		description: "ดูสถิติและข้อมูลการเดินทางทั้งหมด มหาวิทยาลัยราชภัฏเชียงใหม่",
		priority: 0.7,
		frequency: "weekly" as const,
	},
} as const;

export function getFullUrl(route: string): string {
	return `${BASE_URL}${route}`;
}

export function getAllRoutes(): string[] {
	return Object.values(ROUTES);
}
