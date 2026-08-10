import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PropertyValue } from "./properties";

describe("PropertyValue", () => {
	it("renders a Date passed without a formatter", () => {
		render(<PropertyValue value={new Date("2026-08-10T12:34:56.000Z")} />);

		expect(
			screen.getByRole("button", { name: /2026-08-10T12:34:56.000Z/ }),
		).toBeInTheDocument();
	});

	it("renders a Date in a timezone-independent form", () => {
		const value = new Date("2026-08-10T12:34:56.000Z");

		render(<PropertyValue value={value} />);

		expect(screen.getByRole("button")).toHaveTextContent(value.toISOString());
	});

	it("prefers the formatter over the ISO fallback", () => {
		render(
			<PropertyValue
				format={(value) => `on ${value.getUTCFullYear()}`}
				value={new Date("2026-08-10T12:34:56.000Z")}
			/>,
		);

		expect(screen.getByRole("button")).toHaveTextContent("on 2026");
	});

	it("renders string and number values unchanged", () => {
		render(
			<>
				<PropertyValue value="CU-1024" />
				<PropertyValue value={42} />
			</>,
		);

		expect(screen.getByRole("button", { name: /CU-1024/ })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /42/ })).toBeInTheDocument();
	});
});
