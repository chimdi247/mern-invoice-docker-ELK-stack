import { motion } from "framer-motion";
import type { PropsWithChildren } from "react";

export default function AuthButtonAnimation({ children }: PropsWithChildren) {
	return (
		<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}>
			{children}
		</motion.div>
	);
}
