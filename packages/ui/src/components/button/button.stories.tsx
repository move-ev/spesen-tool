import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";

const meta = {
	title: "Components/Button",
	component: Button,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: ["primary", "secondary", "ghost", "danger"],
		},
		size: {
			control: "select",
			options: ["sm", "md", "lg"],
		},
	},
	args: {
		children: "Button",
		disabled: false,
	},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
	args: { variant: "primary" },
};

export const Secondary: Story = {
	args: { variant: "secondary" },
};

export const Ghost: Story = {
	args: { variant: "ghost" },
};

export const Danger: Story = {
	args: { variant: "danger" },
};

export const Disabled: Story = {
	args: { variant: "primary", disabled: true },
};
