import type { Meta, StoryObj } from "@storybook/react-vite";
import type * as React from "react";
import { Button } from "../button";
import { Input } from "../input";
import {
	Sheet,
	SheetBody,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from ".";

type SheetSide = React.ComponentProps<typeof SheetContent>["side"];

const meta = {
	title: "Components/Sheet",
	component: Sheet,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		open: {
			control: "boolean",
		},
		side: {
			control: "inline-radio",
			options: ["top", "right", "bottom", "left"],
		},
	},
	args: {
		side: "right",
	},
	render: ({ side, ...args }) => (
		<Sheet {...args}>
			<SheetTrigger render={<Button variant="outline">Open</Button>} />
			<SheetContent side={side}>
				<SheetHeader>
					<SheetTitle>Edit profile</SheetTitle>
					<SheetDescription>
						Make changes to your profile here. Click save when you&apos;re done.
					</SheetDescription>
				</SheetHeader>
				<SheetBody className="grid flex-1 auto-rows-min gap-6">
					<div className="grid gap-3">
						<label htmlFor="sheet-demo-name">Name</label>
						<Input defaultValue="Pedro Duarte" id="sheet-demo-name" />
					</div>
					<div className="grid gap-3">
						<label htmlFor="sheet-demo-username">Username</label>
						<Input defaultValue="@peduarte" id="sheet-demo-username" />
					</div>
				</SheetBody>
				<SheetFooter>
					<Button type="submit">Save changes</Button>
					<SheetClose render={<Button variant="outline">Close</Button>} />
				</SheetFooter>
			</SheetContent>
		</Sheet>
	),
} satisfies Meta<React.ComponentProps<typeof Sheet> & { side?: SheetSide }>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLargeBody: Story = {
	render: ({ side, ...args }) => (
		<Sheet {...args}>
			<SheetTrigger render={<Button variant="outline">Open</Button>} />
			<SheetContent side={side}>
				<SheetHeader>
					<SheetTitle>Edit profile</SheetTitle>
					<SheetDescription>
						Make changes to your profile here. Click save when you&apos;re done.
					</SheetDescription>
				</SheetHeader>
				<SheetBody>
					<p>
						Lorem ipsum dolor sit amet consectetur, adipisicing elit. Iste sit
						perspiciatis unde cumque, eligendi culpa velit quae maxime nemo ullam
						mollitia, ut aut, illum assumenda nobis consectetur eius illo enim.
						Doloremque cum accusantium tenetur a veritatis accusamus incidunt numquam
						deserunt, sed magnam perferendis recusandae ab itaque sapiente error
						praesentium eveniet quasi, eius nulla illum eaque. Consectetur officiis
						hic architecto delectus! Odio expedita quia minima! Eius, dolores?
						Voluptatum, dolor similique. Qui, optio enim. Iusto dignissimos, officiis
						veniam deleniti quibusdam ab fugiat fugit aliquam eligendi laborum libero
						voluptatibus est dolore porro beatae. Labore odit, pariatur itaque hic,
						nemo reprehenderit voluptates minima non delectus suscipit illo minus esse
						commodi eaque doloremque mollitia quisquam eum. Id, possimus excepturi.
						Sunt laborum dolorem rerum excepturi corrupti. Aut, a, rem maxime fugiat
						natus recusandae itaque, reprehenderit magnam porro praesentium animi
						laudantium voluptate doloribus! Quam cum doloremque eos ipsum pariatur?
						Dicta, sed quam commodi molestias fuga ad harum. Enim voluptatum
						voluptatem ullam culpa. Aspernatur, quo culpa maxime impedit perferendis
						fugiat necessitatibus sunt commodi consequatur, at atque assumenda
						adipisci porro modi saepe est dolores laudantium enim nam alias quas!
						Facere facilis quis adipisci nihil nemo ab pariatur distinctio, deserunt
						assumenda accusamus nam praesentium ipsa maiores cupiditate exercitationem
						earum fugiat voluptatem eaque ipsum modi! Consequatur, earum quibusdam!
						Placeat, ratione expedita! Eum eius nihil voluptates ab a est vero
						corporis sed ullam iusto, dolore obcaecati minus autem iste accusantium ea
						at, quia amet qui. Voluptas doloremque quibusdam iusto unde perspiciatis
						nam? Minima aut, hic laudantium sit harum nostrum dolorem. Vel, ut
						voluptatem nihil molestiae eligendi magni optio corporis consequatur non,
						ipsam, assumenda voluptates rerum quia officia sequi iste eius harum
						repellat. Voluptatum cum pariatur dignissimos sapiente dicta officia autem
						inventore esse, ipsa laudantium sint ratione cupiditate reiciendis ea est
						nisi quia at expedita, voluptate nihil, aliquid qui debitis? Illum, ex
						atque! Aliquam reprehenderit tempora saepe doloribus deserunt illo
						exercitationem asperiores et similique explicabo fugiat in neque,
						dignissimos corporis ratione vitae maiores, quam totam perspiciatis alias?
						Ducimus, fuga! Eum, aliquid atque? At. Consectetur, nesciunt omnis
						reiciendis voluptatum magni nostrum. Distinctio doloremque sit, quibusdam
						quae voluptate odio rerum earum impedit ex. Hic dignissimos temporibus
						deserunt nulla veniam iure doloremque animi velit, magnam eius. Sint
						laudantium commodi excepturi veniam, quasi voluptate sed quia magnam ullam
						possimus deserunt dolore neque quidem maiores id. Quisquam nesciunt
						temporibus inventore eligendi laboriosam ipsam nobis accusantium, enim
						nemo numquam! At sequi dolorum cupiditate voluptates, maiores facere.
						Neque inventore labore ex aliquam nostrum? Commodi dolores eveniet ducimus
						quas laudantium impedit similique neque exercitationem. Ea possimus
						officiis laudantium nesciunt tenetur voluptate! Omnis, porro odit? Esse
						mollitia sequi perferendis sunt optio facilis ea illo dolorem? Beatae
						voluptatum quo laudantium error quae recusandae incidunt ipsa at sit.
						Culpa saepe cupiditate nulla exercitationem illo. Ex repellat laboriosam
						dolor numquam blanditiis ab voluptatem nulla. Recusandae, voluptas! Nulla
						similique optio reprehenderit quam, assumenda iure repellat animi quae
						vero minima eveniet, obcaecati eum repudiandae autem laborum sed. Ab
						molestias ducimus ipsum reprehenderit ut, mollitia optio eaque
						voluptatibus perspiciatis quasi repudiandae consequuntur, nisi beatae,
						voluptatum dolorem delectus unde? Maxime quasi quis nobis corporis
						necessitatibus hic, aspernatur animi est. Culpa et quam voluptatem
						consequuntur in molestias sunt dolores, aliquam amet dolor temporibus aut
						necessitatibus voluptate fugit ut voluptas iusto optio iure ea iste ullam
						fuga eaque. Distinctio, saepe eligendi? Incidunt reiciendis explicabo quo,
						quae ad dolorum distinctio qui, ipsum dignissimos sequi blanditiis
						accusamus eligendi minus nisi consectetur, expedita culpa illo mollitia
						velit quod esse. Minima voluptas sint tenetur veniam! Sapiente dolorem
						corporis nisi numquam necessitatibus quisquam omnis ducimus laboriosam
						placeat. Autem saepe repellat ullam laborum ipsa quaerat architecto
						obcaecati ratione tempora quasi! Illo quod sapiente mollitia accusantium
						possimus provident. Minima labore veritatis doloremque perspiciatis
						aperiam voluptates officia illum voluptas, molestias expedita modi quas
						praesentium, ipsum magnam molestiae. Dolor laudantium magnam molestiae in
						voluptate! Dolores nobis cupiditate inventore facere dolor. Consequatur
						praesentium aliquid reiciendis alias inventore, harum qui, enim nisi
						exercitationem nobis mollitia debitis libero est porro? Ipsum possimus
						obcaecati eos minima omnis, error architecto quae laudantium neque
						distinctio veniam! Deserunt ipsum natus voluptate soluta, repellat quidem,
						animi praesentium quo odio iste voluptatibus at quibusdam amet ex in rerum
						officia ea quia culpa architecto repudiandae delectus aperiam repellendus.
						Atque, doloremque. Error, placeat ab ipsum facere provident at iste libero
						ipsa nobis corrupti eos dolore quod, commodi nihil blanditiis rem.
						Consequatur laudantium voluptatem ab facere aut veniam autem voluptatum
						delectus sequi? Porro expedita non laboriosam numquam deleniti id? Fuga ea
						voluptas rem magni, ducimus, nisi dolore cumque, sint ipsam non quas
						molestias! Numquam in rem unde similique expedita quidem eaque aut. Quam
						minima, ipsum dolor aspernatur eum iusto nam nostrum repellat dolorem sed!
						Ducimus recusandae, vero doloribus quas, odit, exercitationem veniam
						tempore possimus sunt excepturi iusto laudantium repellat soluta
						reprehenderit ea. Incidunt placeat, omnis necessitatibus numquam deleniti
						tempora, mollitia similique obcaecati, est blanditiis adipisci
						accusantium? Illum soluta nostrum similique dignissimos assumenda
						perspiciatis. Ut repudiandae unde tempora, neque nisi enim eos vitae?
						Animi nisi, aut omnis tenetur, cumque provident veritatis eaque voluptatum
						impedit libero vel! Impedit consectetur hic corrupti, dolore commodi vel
						odio repellat. Tempora perferendis magni vitae laboriosam facere. Cumque,
						saepe. Vitae totam laboriosam omnis a modi cupiditate, quasi labore
						laborum. Cum, ullam reiciendis magni, debitis, non saepe a animi minus
						veniam corrupti modi quae aliquid. Distinctio inventore minus harum
						deleniti? Quidem consequatur hic, debitis libero perferendis sit provident
						dicta maxime dignissimos fugiat cumque nam? Eligendi quam est impedit
						rerum tempore commodi. Fugit harum architecto dignissimos quos optio
						culpa, quo fuga! Amet quasi laudantium sint dolorum, nihil itaque, sed
						tempora doloribus quidem quae pariatur, voluptate autem? Molestias
						perspiciatis, quia maiores magnam, odit corrupti quaerat provident culpa
						et consequatur expedita pariatur similique! Omnis aperiam iusto commodi
						beatae et. Vitae deleniti quisquam nam labore amet porro ratione, quasi
						sint mollitia, distinctio, molestiae illum officiis dolore! Libero, quo
						temporibus sed dolorum tempore eius nisi.
					</p>
				</SheetBody>
				<SheetFooter>
					<Button type="submit">Save changes</Button>
					<SheetClose render={<Button variant="outline">Close</Button>} />
				</SheetFooter>
			</SheetContent>
		</Sheet>
	),
};

export const Left: Story = {
	args: {
		side: "left",
	},
};

export const Top: Story = {
	args: {
		side: "top",
	},
};

export const Right: Story = {
	args: {
		side: "right",
	},
};

export const Bottom: Story = {
	args: {
		side: "bottom",
	},
};
