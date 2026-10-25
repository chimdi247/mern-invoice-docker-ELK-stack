import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

interface PaymentDateProps {
	/** ISO date string */
	datePaid: string;
	setDatePaid: (isoDate: string) => void;
}

const PaymentDate = ({ datePaid, setDatePaid }: PaymentDateProps) => {
	const handleChange = (date: Date | null) => {
		if (date && !Number.isNaN(date.getTime())) {
			setDatePaid(date.toISOString());
		}
	};

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns}>
			<DesktopDatePicker
				label="Date Paid"
				format="MM/dd/yyyy"
				value={new Date(datePaid)}
				onChange={handleChange}
				slotProps={{ textField: { variant: "standard", sx: { width: "100%" } } }}
			/>
		</LocalizationProvider>
	);
};

export default PaymentDate;
