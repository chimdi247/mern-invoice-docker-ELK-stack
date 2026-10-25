import { useEffect } from "react";

const GoogleCallbackPage = () => {
	useEffect(() => {
		const token = new URLSearchParams(window.location.search).get("token");
		if (token) {
			window.localStorage.setItem("googleToken", token);
			// full reload so the app re-initialises and reads the token from localStorage
			window.location.replace("/dashboard");
		} else {
			window.location.replace("/login");
		}
	}, []);

	return null;
};

export default GoogleCallbackPage;
