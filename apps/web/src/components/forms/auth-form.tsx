"use client";

import { useForm } from "@tanstack/react-form";
import { Button } from "@zemio/ui/components/button";
import { toast } from "sonner";
import { z } from "zod";
import { ROUTES } from "@/lib/consts";
import { authClient } from "@/server/better-auth/client";

const formSchema = z.object({});

export function AuthForm({ ...props }: React.ComponentProps<"form">) {
	const signInWithMicrosoft = async () => {
		const res = await authClient.signIn.social({
			provider: "microsoft",
			callbackURL: ROUTES.USER_DASHBOARD,
		});

		if (res.error) {
			toast.error(res.error.message ?? "Ein Fehler ist aufgetreten");
			return;
		}

		toast.success("Anmeldung erfolgreich", {
			description: "Du wirst in Kürze weitergeleitet",
		});
	};

	const form = useForm({
		defaultValues: {},
		validators: {
			onSubmit: formSchema,
		},
		onSubmit: async () => {
			await signInWithMicrosoft();
		},
	});

	return (
		<form
			id="auth-form"
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			{...props}
		>
			<Button
				className={"w-full"}
				form="auth-form"
				type="submit"
				variant={"outline"}
			>
				Login with Microsoft
			</Button>
		</form>
	);
}
