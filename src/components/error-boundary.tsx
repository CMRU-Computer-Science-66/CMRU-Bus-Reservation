import React, { Component, type ReactNode } from "react";

interface Properties {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	error?: Error;
	hasError: boolean;
}

export class ErrorBoundary extends Component<Properties, State> {
	constructor(properties: Properties) {
		super(properties);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return {
			hasError: true,
			error,
		};
	}

	override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error(error, errorInfo);
	}

	override render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="flex min-h-screen items-center justify-center">
					<div className="text-center">
						<h1 className="mb-4 text-2xl font-bold text-gray-900">เกิดข้อผิดพลาด</h1>
						<p className="mb-4 text-gray-600">ขออภัย มีข้อผิดพลาดเกิดขึ้นในระบบ</p>
						<button type="button" onClick={() => window.location.reload()} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
							รีโหลดหน้าเว็บ
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
