import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	CreditCardIcon,
	GitForkIcon,
	IdCardIcon,
	LifeBuoyIcon,
	LogOutIcon,
	MailIcon,
	PlusIcon,
	SearchIcon,
	ServerIcon,
	SettingsIcon,
	Users2Icon,
} from "lucide-react";
import { Button } from "../button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubSearch,
	DropdownMenuSubSearchEmpty,
	DropdownMenuSubSearchInput,
	DropdownMenuSubSearchItem,
	DropdownMenuSubSearchList,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "./dropdown-menu";

const meta = {
	title: "Components/DropdownMenu",
	component: DropdownMenu,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		disabled: {
			control: "boolean",
		},
	},
	args: {
		disabled: false,
	},
	render: (args) => (
		<DropdownMenu {...args}>
			<DropdownMenuTrigger render={<Button variant="outline">Open</Button>} />
			<DropdownMenuContent align="start" className="w-64">
				<DropdownMenuGroup>
					<DropdownMenuLabel>My Account</DropdownMenuLabel>
					<DropdownMenuItem>
						<IdCardIcon data-icon />
						Profile
						<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
					</DropdownMenuItem>
					<DropdownMenuItem>
						<CreditCardIcon />
						Billing
						<DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
					</DropdownMenuItem>
					<DropdownMenuItem>
						<SettingsIcon />
						Settings
						<DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>
						<Users2Icon />
						Team
					</DropdownMenuItem>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							<MailIcon />
							Invite users
						</DropdownMenuSubTrigger>
						<DropdownMenuPortal>
							<DropdownMenuSubContent>
								<DropdownMenuGroup>
									<DropdownMenuItem>Email</DropdownMenuItem>
									<DropdownMenuItem>Message</DropdownMenuItem>
								</DropdownMenuGroup>
								<DropdownMenuSeparator />
								<DropdownMenuGroup>
									<DropdownMenuItem>More...</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuSubContent>
						</DropdownMenuPortal>
					</DropdownMenuSub>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							<SearchIcon />
							Search users
						</DropdownMenuSubTrigger>
						<DropdownMenuPortal>
							<DropdownMenuSubSearch
								items={[
									{ value: "apple", label: "Apple" },
									{ value: "banana", label: "Banana" },
									{ value: "blueberry", label: "Blueberry" },
									{ value: "grapes", label: "Grapes" },
									{ value: "pineapple", label: "Pineapple" },
								]}
							>
								<DropdownMenuSubSearchInput placeholder={"Search"} />
								<DropdownMenuSubSearchEmpty>
									<div>No Results</div>
								</DropdownMenuSubSearchEmpty>
								<DropdownMenuSubSearchList>
									{(option: { label: string; value: string }) => (
										<DropdownMenuSubSearchItem
											// checked={selectedValues.includes(option.value)}
											key={option.value}
											// onClick={() => handleToggle(option.value)}
											value={option}
										>
											{/* {renderOptionContent(option)} */}
											{option.label}
										</DropdownMenuSubSearchItem>
									)}
								</DropdownMenuSubSearchList>
							</DropdownMenuSubSearch>
						</DropdownMenuPortal>
					</DropdownMenuSub>
					<DropdownMenuItem>
						<PlusIcon />
						New Team
						<DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>
						<GitForkIcon />
						GitHub
					</DropdownMenuItem>
					<DropdownMenuItem>
						<LifeBuoyIcon />
						Support
					</DropdownMenuItem>
					<DropdownMenuItem disabled>
						<ServerIcon />
						API
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem variant="destructive">
						<LogOutIcon />
						Log out
						<DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	),
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
