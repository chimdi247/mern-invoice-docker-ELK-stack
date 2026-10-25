import PaidIcon from "@mui/icons-material/Paid";
import {
	Autocomplete,
	Box,
	TextField,
	Typography,
	Button,
} from "@mui/material";
import { toast } from "react-toastify";
import Spinner from "../../../components/Spinner";
import { useEffect, useState } from "react";
import PaymentDate from "./components/PaymentDate";

import {
	useCreatePaymentMutation,
	useUpdateDocMutation,
} from "../documentsApiSlice";
import { getErrorMessage } from "../../../utils/errors";
import type { InvoiceDocument, PaymentRecord } from "../../../types";

const PaymentForm = ({ document }: { document: InvoiceDocument }) => {
	const [createPayment, { isLoading, isSuccess, data }] =
		useCreatePaymentMutation();

	const [updateDoc] = useUpdateDocMutation();

	const paymentOptions = [
		"Mobile Money",
		"Cash",
		"Bank Transfer",
		"PayPal",
		"Credit Card",
		"Others",
	];

	const [datePaid, setDatePaid] = useState<string>(new Date().toISOString());
	const [paymentMethod, setPaymentMethod] = useState<PaymentRecord["paymentMethod"] | "">("");
	const [additionalInfo, setAdditionalInfo] = useState("");
	const [amountPaid, setAmountPaid] = useState(0);
	const [totalAmountReceived, setTotalAmountReceived] = useState(0);

	useEffect(() => {
		if (isSuccess) {
			const message = data?.message;
			toast.success(message);
			setAmountPaid(0);
			setPaymentMethod("");
			setAdditionalInfo("");
		}
	}, [data, isSuccess]);

	useEffect(() => {
		let totalReceived = 0;
		for (let i = 0; i < (document?.paymentRecords?.length ?? 0); i++) {
			totalReceived += Number(document?.paymentRecords?.[i]?.amountPaid);
			setTotalAmountReceived(totalReceived);
		}
	}, [document, totalAmountReceived]);

	const paymentHandler = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			await createPayment({
				id: document._id,
				paidBy: document.customer.name,
				datePaid,
				paymentMethod,
				additionalInfo,
				amountPaid,
			}).unwrap();

			await updateDoc({
				id: document._id,
				totalAmountReceived:
					Number(totalAmountReceived) + Number(amountPaid),
				status:
					Number(totalAmountReceived) + Number(amountPaid) >=
					document?.total
						? "Paid"
						: "Not Fully Paid",
			}).unwrap();
		} catch (err) {
			const message = getErrorMessage(err);
			toast.error(message);
		}
	};

	return (
		<Box
			sx={{
				mt: "1rem",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
			}}
			component="form"
			noValidate
			autoComplete="off"
			onSubmit={paymentHandler}
		>
			{isLoading ? (
				<Spinner />
			) : (
				<>
					<PaymentDate
						datePaid={datePaid}
						setDatePaid={setDatePaid}
					/>
					<TextField
						margin="dense"
						name="amountPaid"
						label="Amount Paid"
						type="number"
						fullWidth
						variant="standard"
						onChange={(e) => setAmountPaid(Number(e.target.value))}
						value={amountPaid}
					/>

					<Autocomplete
						options={paymentOptions}
						sx={{ width: "100%" }}
						renderInput={(params) => (
							<TextField
								{...params}
								label="Payment Method"
								variant="standard"
							/>
						)}
						onChange={(_event, value) => setPaymentMethod((value ?? "") as PaymentRecord["paymentMethod"] | "")}
					/>

					<TextField
						margin="dense"
						name="additionalInfo"
						label="Additional Info"
						type="text"
						fullWidth
						variant="standard"
						onChange={(e) => setAdditionalInfo(e.target.value)}
						value={additionalInfo}
					/>
				</>
			)}

			<Button
				sx={{ mt: 3, mb: 2 }}
				type="submit"
				fullWidth
				variant="contained"
				color="success"
				size="large"
				startIcon={<PaidIcon />}
				disabled={!amountPaid || !paymentMethod ? true : false}
			>
				<Typography variant="h5">Record Payment</Typography>
			</Button>
		</Box>
	);
};

export default PaymentForm;
