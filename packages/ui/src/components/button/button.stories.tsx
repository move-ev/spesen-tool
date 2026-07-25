import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleDashedIcon } from "lucide-react";
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
				Button <CircleDashedIcon data-icon="inline-end" />
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

const renderIconOnly: Story["render"] = (args) => (
	<Button {...args}>
		<CircleDashedIcon />
	</Button>
);

export const IconSmall: Story = {
	args: { variant: "default", size: "icon-sm" },
	render: renderIconOnly,
};

export const Icon: Story = {
	args: { variant: "default", size: "icon" },
	render: renderIconOnly,
};

export const IconLarge: Story = {
	args: { variant: "default", size: "icon-lg" },
	render: renderIconOnly,
};
