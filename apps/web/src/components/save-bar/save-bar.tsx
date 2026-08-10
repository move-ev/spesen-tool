"use client";

import { Button } from "@zemio/ui";
import { CheckIcon, LoaderIcon } from "lucide-react";
import {
	AnimatePresence,
	type HTMLMotionProps,
	motion,
	useReducedMotion,
} from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useSaveBarStore } from "./save-bar-store";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const SUCCESS_VISIBLE_MS = 1000;

function SaveBar({ className, ...props }: HTMLMotionProps<"div">) {
	const t = useTranslations("common.saveBar");
	const forms = useSaveBarStore((state) => state.forms);
	const shouldReduceMotion = useReducedMotion();
	const [mounted, setMounted] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);
	const wasSavingRef = useRef(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const entries = Object.values(forms);
	const dirtyEntries = entries.filter((entry) => entry.isDirty);
	const isSaving = entries.some((entry) => entry.isSaving);

	// A save just finished and every form came out clean → show the success
	// state for a moment before the bar leaves. Failed forms stay dirty, so a
	// partial failure keeps the bar in its normal state instead.
	useEffect(() => {
		const wasSaving = wasSavingRef.current;
		wasSavingRef.current = isSaving;
		if (wasSaving && !isSaving && dirtyEntries.length === 0) {
			setShowSuccess(true);
			const timer = setTimeout(() => setShowSuccess(false), SUCCESS_VISIBLE_MS);
			return () => clearTimeout(timer);
		}
	}, [isSaving, dirtyEntries.length]);

	const isSuccess = showSuccess && !isSaving && dirtyEntries.length === 0;
	const isOpen = dirtyEntries.length > 0 || isSaving || showSuccess;

	if (!mounted) {
		return null;
	}

	const layout = !shouldReduceMotion;
	const hidden = shouldReduceMotion ? "translateY(0px)" : "translateY(16px)";

	// The outer wrapper owns enter/exit (animated transform) and the inner bar
	// owns the width morph (layout FLIP) — Motion can't do both on one element.
	return createPortal(
		<AnimatePresence>
			{isOpen && (
				<motion.div
					animate={{ opacity: 1, transform: "translateY(0px)" }}
					className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center"
					exit={{
						opacity: 0,
						transform: hidden,
						transition: { duration: 0.15, ease: EASE_OUT },
					}}
					initial={{ opacity: 0, transform: hidden }}
					transition={{ duration: 0.25, ease: EASE_OUT }}
				>
					<motion.div
						className={cn(
							"pointer-events-auto flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 shadow-base-900/20 shadow-lg",
							className,
						)}
						data-slot="save-bar"
						layout={layout}
						transition={{ duration: 0.25, ease: EASE_OUT }}
						{...props}
					>
						<motion.p
							className="mr-4 font-semibold text-sm text-white"
							layout={layout && "position"}
							role="status"
							transition={{ duration: 0.25, ease: EASE_OUT }}
						>
							<AnimatePresence initial={false} mode="popLayout">
								<motion.span
									animate={{ opacity: 1, filter: "blur(0px)" }}
									className="inline-block"
									exit={{ opacity: 0, filter: "blur(2px)" }}
									initial={{ opacity: 0, filter: "blur(2px)" }}
									key={isSuccess ? "saved" : "unsaved"}
									transition={{ duration: 0.15, ease: EASE_OUT }}
								>
									{isSuccess ? t("savedMessage") : t("message")}
								</motion.span>
							</AnimatePresence>
						</motion.p>
						<motion.div
							layout={layout && "position"}
							transition={{ duration: 0.25, ease: EASE_OUT }}
						>
							<Button
								className={"border-base-700 text-base-200 hover:bg-base-800"}
								disabled={isSaving}
								onClick={() => {
									for (const entry of dirtyEntries) {
										entry.discard();
									}
								}}
								size="sm"
								type="button"
								variant="outline"
							>
								{t("discard")}
							</Button>
						</motion.div>
						<motion.div
							layout={layout}
							transition={{ duration: 0.25, ease: EASE_OUT }}
						>
							<Button
								disabled={isSaving}
								onClick={() => {
									for (const entry of dirtyEntries) {
										entry.save();
									}
								}}
								size="sm"
								type="button"
							>
								<AnimatePresence initial={false} mode="popLayout">
									{isSaving ? (
										<motion.span
											animate={{ opacity: 1, filter: "blur(0px)" }}
											className="flex items-center gap-2"
											exit={{ opacity: 0, filter: "blur(2px)" }}
											initial={{ opacity: 0, filter: "blur(2px)" }}
											key="saving"
											transition={{ duration: 0.15, ease: EASE_OUT }}
										>
											<LoaderIcon aria-hidden className="animate-spin" />
											{t("saving")}
										</motion.span>
									) : isSuccess ? (
										<motion.span
											animate={{ opacity: 1, filter: "blur(0px)" }}
											className="flex items-center gap-2"
											exit={{ opacity: 0, filter: "blur(2px)" }}
											initial={{ opacity: 0, filter: "blur(2px)" }}
											key="saved"
											transition={{ duration: 0.15, ease: EASE_OUT }}
										>
											<CheckIcon aria-hidden />
											{t("saved")}
										</motion.span>
									) : (
										<motion.span
											animate={{ opacity: 1, filter: "blur(0px)" }}
											exit={{ opacity: 0, filter: "blur(2px)" }}
											initial={{ opacity: 0, filter: "blur(2px)" }}
											key="save"
											transition={{ duration: 0.15, ease: EASE_OUT }}
										>
											{t("save")}
										</motion.span>
									)}
								</AnimatePresence>
							</Button>
						</motion.div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body,
	);
}

export { SaveBar };
