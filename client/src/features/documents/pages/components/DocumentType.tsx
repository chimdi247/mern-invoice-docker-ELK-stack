import { Box, Input, styled } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";
import type { DocumentKind } from "../../../../types";

const StyledSelect = styled(Select)({
	fontSize: "2rem",
	textTransform: "uppercase",
	fontWeight: "bold",
});

interface DocumentTypeProps {
	documentType: DocumentKind;
	setDocumentType: (type: DocumentKind) => void;
}

const DocumentType = ({ documentType, setDocumentType }: DocumentTypeProps) => {
	const handleChange = (e: SelectChangeEvent<unknown>) => {
		setDocumentType(e.target.value as DocumentKind);
	};
	return (
		<Box sx={{ marginLeft: "400px", marginBottom: "15px" }}>
			<FormControl sx={{ m: 1, minWidth: 120 }}>
				<StyledSelect
					input={<Input />}
					labelId="doc-helper-label"
					id="doc-select-helper"
					value={documentType}
					label="Select Document"
					onChange={handleChange}
				>
					<MenuItem value="">
						<em>Select Document Type</em>
					</MenuItem>
					<MenuItem value="Invoice">Invoice</MenuItem>
					<MenuItem value="Receipt">Receipt</MenuItem>
					<MenuItem value="Quotation">Quotation</MenuItem>
				</StyledSelect>
				<FormHelperText>
					Select a Document to generate, defaults to Invoice
				</FormHelperText>
			</FormControl>
		</Box>
	);
};

export default DocumentType;
