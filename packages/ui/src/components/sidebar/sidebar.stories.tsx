import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sidebar } from "./sidebar";
import DemoPage1 from "./sidebar.demo";

const meta = {
	title: "Components/Sidebar",
	component: Sidebar,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
	render: (args) => <DemoPage1 {...args} />,
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
