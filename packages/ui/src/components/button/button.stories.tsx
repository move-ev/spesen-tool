import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleDash } from "../placeholder/circle-dash";
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
			options: ["default", "outline", "ghost", "destructive"],
		},
		size: {
			control: "select",
			options: ["sm", "default", "lg", "icon-sm", "icon", "icon-lg"],
		},
	},
	args: {
		children: (
			<>
				Button <CircleDash data-icon="inline-end" />
			</>
		),
		disabled: false,
	},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { variant: "default" },
};

export const Outline: Story = {
	args: { variant: "outline" },
};

export const Ghost: Story = {
	args: { variant: "ghost" },
};

export const Danger: Story = {
	args: { variant: "destructive" },
};

export const Disabled: Story = {
	args: { variant: "default", disabled: true },
};
