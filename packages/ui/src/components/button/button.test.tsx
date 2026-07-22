import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";

describe("Button", () => {
	it("renders its children", () => {
		render(<Button>Submit</Button>);
		expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
	});

	it("applies the danger variant class", () => {
		render(<Button variant="danger">Delete</Button>);
		expect(screen.getByRole("button")).toHaveClass("bg-ui-danger");
	});

	it("fires onClick when clicked", async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();
		render(<Button onClick={onClick}>Click me</Button>);

		await user.click(screen.getByRole("button"));

		expect(onClick).toHaveBeenCalledOnce();
	});

	it("does not fire onClick when disabled", async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();
		render(
			<Button disabled onClick={onClick}>
				Click me
			</Button>,
		);

		await user.click(screen.getByRole("button"));

		expect(onClick).not.toHaveBeenCalled();
	});
});
