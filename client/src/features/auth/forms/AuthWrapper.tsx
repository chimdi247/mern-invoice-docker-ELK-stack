import { Box } from "@mui/material";
import type { PropsWithChildren } from "react";

const AuthWrapper = ({ children }: PropsWithChildren) => {
	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "115vh",
			}}
		>
			{children}
		</Box>
	);
};

export default AuthWrapper;
