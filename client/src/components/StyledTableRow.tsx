import { styled, TableRow } from "@mui/material";
import type { PropsWithChildren } from "react";

const TableRowStyled = styled(TableRow)(({ theme }) => ({
	"&:nth-of-type(odd)": {
		backgroundColor: theme.palette.action.hover,
	},
	"&:last-child td, &:last-child th": {
		border: 0,
	},
}));

const StyledTableRow = ({ children }: PropsWithChildren) => {
	return <TableRowStyled>{children}</TableRowStyled>;
};

export default StyledTableRow;
