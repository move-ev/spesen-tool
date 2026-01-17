"use client";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { z } from "zod";
import { ROUTES } from "@/lib/consts";
import { authClient } from "@/server/better-auth/client";
import { Button } from "../ui/button";

const formSchema = z.object({});

export function LoginForm({ ...props }: React.ComponentProps<"form">) {
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
			id="login-form"
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			{...props}
		>
			<Button className={"w-full"} type="submit" variant={"outline"}>
				Login with Microsoft
			</Button>
		</form>
	);
}
