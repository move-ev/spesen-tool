import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import { ButtonGroup } from "./button-group";

const meta = {
	title: "Components/ButtonGroup",
	component: ButtonGroup,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {},
	args: {},
	render: (args) => (
		<ButtonGroup {...args}>
			<Button variant={"outline"}>Archive</Button>
			<Button variant={"outline"}>Report</Button>
		</ButtonGroup>
	),
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Vertical: Story = {
	render: (args) => (
		<ButtonGroup {...args} orientation={"vertical"}>
			<Button variant={"outline"}>Archive</Button>
			<Button variant={"outline"}>Report</Button>
		</ButtonGroup>
	),
};
