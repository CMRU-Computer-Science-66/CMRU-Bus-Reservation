
export function generateQrCodeUrl(studentId: string): string {
	return `https://cmrubus.cmru.ac.th/qrcode_data/${studentId}.png`;
}


export function isValidQrCodeUrl(url: string): boolean {
	const qrCodeUrlPattern = /^https:\/\/cmrubus\.cmru\.ac\.th\/qrcode_data\/\d+\.png$/;
	return qrCodeUrlPattern.test(url);
}