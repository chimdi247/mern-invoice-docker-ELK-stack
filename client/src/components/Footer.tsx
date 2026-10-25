import { Box, CssBaseline, Link, Typography } from "@mui/material";

import { FaMoneyBillWave } from "react-icons/fa";

function Copyright() {
	return (
		<Typography variant="body2" align="center" sx={{ color: "#ffffff" }}>
			{"Copyright ©"}
			<Link color="inherit" href="https://github.com/API-Imperfect">
				MERN Invoice
			</Link>{" "}
			{new Date().getFullYear()} {"."}
		</Typography>
	);
}

const Footer = () => {
	return (
		<Box
			sx={{
				bgcolor: "#000000",
				marginTop: "auto",
			}}
			className="footer"
		>
			<CssBaseline />

			<Box
				component="footer"
				sx={{
					py: 1,
					px: 1,
					mt: "auto",
					bgcolor: "#000000",
				}}
			>
				<Typography
					variant="subtitle1"
					align="center"
					component="p"
					sx={{ color: "#07f011" }}
				>
					<FaMoneyBillWave /> Because Money is as important as oxygen!{" "}
					<FaMoneyBillWave />
				</Typography>
				<Copyright />
			</Box>
		</Box>
	);
};

export default Footer;
