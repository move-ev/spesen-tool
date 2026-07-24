import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	BellIcon,
	CarIcon,
	TrashIcon,
	UtensilsIcon,
	ZapIcon,
} from "lucide-react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "./select";

const fruits = [
	{ value: "apple", label: "Apple", icon: UtensilsIcon },
	{ value: "banana", label: "Banana", icon: CarIcon },
	{ value: "blueberry", label: "Blueberry", icon: BellIcon },
	{ value: "grapes", label: "Grapes", icon: TrashIcon },
	{ value: "pineapple", label: "Pineapple", icon: ZapIcon },
];

const meta = {
	title: "Components/Select",
	component: Select,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		disabled: {
			control: "boolean",
		},
		required: {
			control: "boolean",
		},
	},
	args: {
		disabled: false,
		required: false,
	},
	render: (args) => (
		<Select {...args}>
			<SelectTrigger>
				<SelectValue placeholder="Select a fruit" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					{fruits.map((fruit) => (
						<SelectItem key={fruit.value} value={fruit.value}>
							{fruit.icon && <fruit.icon data-icon />}
							{fruit.label}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	),
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDefaultValue: Story = {
	args: { defaultValue: "banana" },
};

export const Disabled: Story = {
	args: { disabled: true, defaultValue: "apple" },
};

export const WithGroupsAndLabels: Story = {
	render: (args) => (
		<Select {...args}>
			<SelectTrigger>
				<SelectValue placeholder="Select a fruit" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>Citrus</SelectLabel>
					<SelectItem value="orange">Orange</SelectItem>
					<SelectItem value="lemon">Lemon</SelectItem>
				</SelectGroup>
				<SelectSeparator />
				<SelectGroup>
					<SelectLabel>Berries</SelectLabel>
					<SelectItem value="strawberry">Strawberry</SelectItem>
					<SelectItem value="blueberry">Blueberry</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	),
};

export const DisabledItems: Story = {
	render: (args) => (
		<Select {...args}>
			<SelectTrigger>
				<SelectValue placeholder="Select a fruit" />
			</SelectTrigger>
			<SelectContent alignItemWithTrigger={false}>
				<SelectGroup>
					<SelectItem disabled value="orange">
						Orange
					</SelectItem>
					<SelectItem value="lemon">Lemon</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	),
};

export const Inavlid: Story = {
	render: (args) => (
		<Select data-invalid {...args}>
			<SelectTrigger aria-invalid>
				<SelectValue placeholder="Select a fruit" />
			</SelectTrigger>
			<SelectContent alignItemWithTrigger={false}>
				<SelectGroup>
					<SelectItem disabled value="orange">
						Orange
					</SelectItem>
					<SelectItem value="lemon">Lemon</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	),
};

export const NotAlignedWithTrigger: Story = {
	render: (args) => (
		<Select {...args}>
			<SelectTrigger>
				<SelectValue placeholder="Select a fruit" />
			</SelectTrigger>
			<SelectContent alignItemWithTrigger={false}>
				<SelectGroup>
					<SelectLabel>Citrus</SelectLabel>
					<SelectItem value="orange">Orange</SelectItem>
					<SelectItem value="lemon">Lemon</SelectItem>
				</SelectGroup>
				<SelectSeparator />
				<SelectGroup>
					<SelectLabel>Berries</SelectLabel>
					<SelectItem value="strawberry">Strawberry</SelectItem>
					<SelectItem value="blueberry">Blueberry</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	),
};
