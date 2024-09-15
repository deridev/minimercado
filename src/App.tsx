import Header from "./Header"
import Container from "./Container"
import { useEffect, useState } from "react"

import "./App.css"
import ItemCard from "./ItemCard";
import Customer from "./Customer";
import usePersistentState, { SerializationStrategy } from "./UsePersistentState";

const Categories = Object.freeze({
    GROCERY: { identifier: "grocery", name: "Mercearia" },
    BAKERY: { identifier: "bakery", name: "Padaria" },
    BUTCHER: { identifier: "butcher", name: "Açougue" },
    FRUITS: { identifier: "fruits", name: "Frutas" },
    DRINKS: { identifier: "drinks", name: "Bebidas" },
});

type Item = {
    emoji: string
    name: string
    category: { identifier: string, name: string }
    buyPrice: number
    sellPrice: number
    stockCost: number
}
const ITEMS: Item[] = [
    { emoji: "🍫", name: "Chocolate", category: Categories.GROCERY, buyPrice: 4, sellPrice: 7.25, stockCost: 4 },
    { emoji: "🍱", name: "Arroz", category: Categories.GROCERY, buyPrice: 3, sellPrice: 6.99, stockCost: 2 },
    { emoji: "☕", name: "Café", category: Categories.GROCERY, buyPrice: 7, sellPrice: 13, stockCost: 3 },

    { emoji: "🍞", name: "Pão", category: Categories.BAKERY, buyPrice: 5, sellPrice: 8.9, stockCost: 4 },
    { emoji: "🍩", name: "Rosquinha", category: Categories.BAKERY, buyPrice: 3, sellPrice: 6.23, stockCost: 6 },
    { emoji: "🥪", name: "Sanduíche", category: Categories.BAKERY, buyPrice: 4, sellPrice: 7.5, stockCost: 3 },

    { emoji: "🥩", name: "Bife", category: Categories.BUTCHER, buyPrice: 15, sellPrice: 23.50, stockCost: 3 },
    { emoji: "🥓", name: "Bacon", category: Categories.BUTCHER, buyPrice: 18, sellPrice: 28.99, stockCost: 3 },
    { emoji: "🍗", name: "Frango", category: Categories.BUTCHER, buyPrice: 16, sellPrice: 25.80, stockCost: 3 },

    { emoji: "🍎", name: "Maçã", category: Categories.FRUITS, buyPrice: 3, sellPrice: 6.5, stockCost: 5 },
    { emoji: "🍌", name: "Banana", category: Categories.FRUITS, buyPrice: 2, sellPrice: 4.8, stockCost: 5 },
    { emoji: "🍇", name: "Uva", category: Categories.FRUITS, buyPrice: 3, sellPrice: 6.5, stockCost: 5 },

    { emoji: "💧", name: "Água", category: Categories.DRINKS, buyPrice: 1, sellPrice: 2.25, stockCost: 6 },
    { emoji: "🥤", name: "Refrigerante", category: Categories.DRINKS, buyPrice: 6, sellPrice: 11.99, stockCost: 4 },
    { emoji: "🧃", name: "Suco", category: Categories.DRINKS, buyPrice: 2, sellPrice: 4.99, stockCost: 4 },
];

type ShopItem = {
    name: string
    amount: number
}

export type { Item };

class Stock {
    items: ShopItem[] = [];

    constructor() {
        this.items = [];
    }

    getItem(item: Item): ShopItem {
        if (typeof item === "string") {
            return this.items.find(i => i.name === item) ?? { name: item, amount: 0 };
        } else {
            return this.items.find(i => i.name === item.name) ?? { name: item.name, amount: 0 };
        }
    }

    getItemMaxStock(item: Item, storageLevel: number): number {
        return item.stockCost * storageLevel;
    }

    addItem(item: Item, amount: number) {
        if (this.items.find(i => i.name === item.name)) {
            this.items.find(i => i.name === item.name)!.amount += amount;
        } else {
            this.items.push({ name: item.name, amount });
        }
    }

    removeItem(item: Item, amount: number) {
        if (this.items.find(i => i.name === item.name)) {
            const stockItem = this.items.find(i => i.name === item.name)!;
            stockItem.amount -= amount;
            if (stockItem.amount <= 0) {
                this.items.splice(this.items.indexOf(stockItem), 1);
            }
        }
    }
}

type Notification = string;

type Customer = {
    name: string
    state: State
    wallet: number
    itemsBought: number
    satisfaction: number
    toBuyList: Item[]
}

type State = {
    kind: "entered" | "wandering" | "searching" | "waiting_in_line" | "paying" | "leaving" | "looking_for_a_cashier"
    tickCounter: number,
    item?: Item
}

type UpgradeKind = "storage" | "parking_slots" | "cashier";
type UpgradeDescriptor = {
    kind: UpgradeKind,
    name: string,
    emoji: string,
    baseCost: number,
}

const UPGRADES: UpgradeDescriptor[] = [
    { kind: "storage", name: "Armazenamento", emoji: "📦", baseCost: 100 },
    { kind: "parking_slots", name: "Estacionamento", emoji: "🚗", baseCost: 40 },
    { kind: "cashier", name: "Caixa", emoji: "🛒", baseCost: 100 },
];

type Upgrade = {
    kind: UpgradeKind,
    level: number,
}

function statePriority(stateKind: State["kind"]) {
    switch (stateKind) {
        case "entered":
            return 5;
        case "wandering":
            return 4;
        case "searching":
            return 6;
        case "looking_for_a_cashier":
            return 7;
        case "waiting_in_line":
            return 8;
        case "paying":
            return 9;
        case "leaving":
            return 10;
    }
}

function calculateUpgradeCost(upgradeKind: UpgradeKind, level: number) {
    const descriptor = UPGRADES.find(d => d.kind === upgradeKind)!;
    return descriptor.baseCost * level;
}

const stockStrategy: SerializationStrategy<Stock> = {
    serialize: (stock) => {
        console.log("WRITING: ", JSON.stringify(stock.items));
        return JSON.stringify(stock.items);
    },
    deserialize: (value) => {
        const items = JSON.parse(value);
        console.log("READING: ", items);
        const stock = new Stock();
        stock.items = items;
        return stock;
    },
}

function App() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [stock, setStock] = usePersistentState<Stock>("stock", new Stock(), stockStrategy);
    const [balance, setBalance] = usePersistentState("balance", 100);
    const [reputation, setReputation] = usePersistentState("reputation", 0.5);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [occupiedCashiers, setOccupiedCashiers] = useState<number>(0);
    const [upgrades, setUpgrades] = usePersistentState<Upgrade[]>("upgrades", UPGRADES.map(descriptor => ({ kind: descriptor.kind, level: 1 })));
    const [day, setDay] = usePersistentState("day", 1);
    const [lastDay, setLastDay] = useState(Date.now());

    const getCustomerCapacity = () => upgrades.find(u => u.kind === "parking_slots")!.level + 1;
    const getUpgradeLevel = (upgradeKind: UpgradeKind) => upgrades.find(u => u.kind === upgradeKind)!.level;
    const getCashierAmount = () => upgrades.find(u => u.kind === "cashier")!.level;

    const createCustomer: () => Customer = () => {
        const FIRST_NAMES = ["José", "Maria", "Mark", "John", "Roberto", "Robert", "Lucas", "Lucia", "Pedro", "Ana", "Joana", "Francisco", "Carlos", "Luís", "Paulo", "Ricardo", "Sérgio", "Daniel", "Bruno", "Marcos", "Bob", "Sofia", "Beatriz", "Célia", "Mariana", "Gabriel", "Gabriela", "Ana Maria", "Alice", "Alisson", "Carl", "Paulo", "João", "Neide", "Antenor", "Nilce"];
        const SURNAMES = ["Silva", "da Silva", "Nascimento", "do Nascimento", "Souza", "Pereira", "Carvalho", "Costa", "Santos", "Silveira", "Oliveira", "Gomes", "Alves", "Monteiro", "Martins", "Dias", "Moreira", "Ramos", "Dias", "Cavalcante", "Johnson", "João", "Paulo"];
        const EXTRANAMES = [...SURNAMES, "D.", "Von", "Tren", "Quin", "John"]

        const intraName = Math.random() < .35 ? ` ${EXTRANAMES[Math.floor(Math.random() * EXTRANAMES.length)]} ` : " ";
        const name = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]}${intraName}${SURNAMES[Math.floor(Math.random() * SURNAMES.length)]}`;

        const state = {
            kind: "entered",
            tickCounter: 0,
        } as State;

        const shuffledItems = [...ITEMS].sort(() => Math.random() - 0.5);

        const amountOfItems = Math.random() < .10 ? 12 : 5;
        const itemCount = Math.floor(Math.random() * amountOfItems) + 1; // 1 to amountOfItems items
        const toBuyList: Item[] = shuffledItems.slice(0, itemCount);

        const wallet = (Math.floor(Math.random() * 30) + toBuyList.reduce((acc, item) => acc + item.buyPrice * 0.9, 0)) * (Math.random() + 0.5);
        return { name, state, wallet, toBuyList: toBuyList, satisfaction: 0.1 + Math.random() * 0.6, itemsBought: 0 };
    };

    const pushNotification = (notification: Notification) => {
        const nots = notifications;
        nots.length = Math.min(nots.length, 20);
        setNotifications([notification, ...nots]);
    };

    const buyItem = (item: Item) => {
        const amount = 1;
        const price = item.buyPrice * amount;
        if (balance < price) {
            return;
        }

        if (stock.getItemMaxStock(item, getUpgradeLevel("storage")) < stock.getItem(item).amount + amount) {
            return;
        }

        stock.addItem(item, amount);
        setStock(stock);
        setBalance(balance - price);
        pushNotification(`${item.name} comprado por $ ${item.buyPrice.toFixed(2)}`);
    };

    const buyUpgrade = (upgrade: Upgrade) => {
        const cost = UPGRADES.find(d => d.kind === upgrade.kind)!.baseCost * upgrade.level;
        if (balance < cost) {
            return;
        }

        setBalance(balance - cost);
        setUpgrades(upgrades.map(u => u.kind === upgrade.kind ? { ...u, level: u.level + 1 } : u));
        pushNotification(`${UPGRADES.find(d => d.kind === upgrade.kind)!.name} foi melhorado!`);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if ((Date.now() - lastDay) < 60_000 * 3) {
                return;
            }
            setLastDay(Date.now());
            pushNotification(`O dia ${day} acabou! Custos diários: $ 10,00`);
            setDay(day + 1);
            setBalance(Math.max(balance - 10.0, 0.0));
        }, 1000);

        return () => clearInterval(interval);
    }, [lastDay, day, notifications, balance]);
    useEffect(() => {
        const interval = setInterval(() => {
            const customersState = [...customers];

            if (customers.length < getCustomerCapacity() && Math.random() < reputation && Math.random() > .5) {
                const customer = createCustomer();
                customersState.push(customer);
                pushNotification(`${customer.name} entrou na loja`);
            }

            let currentOccupiedCashiers = occupiedCashiers;
            for (let i = 0; i < customersState.length; i++) {
                const customer = customersState[i];
                customer.state.tickCounter++;
                const extra = customer.state.tickCounter % 2 + (Math.floor(Math.random() * 2));
                
                switch (customer.state.kind) {
                    case "entered":
                        if (customer.state.tickCounter > 1 + extra) {
                            customer.state.kind = "wandering";
                            customer.state.tickCounter = 0;
                        }
                        break;
                    case "wandering":
                        const wanderAmount = 1 + Math.floor(Math.random() * 3);
                        if (customer.state.tickCounter > wanderAmount + extra) {
                            customer.state.kind = "searching";

                            const interestItem = customer.toBuyList[Math.floor(Math.random() * customer.toBuyList.length)]
                                ?? ITEMS[Math.floor(Math.random() * ITEMS.length)];
                            if (interestItem.sellPrice > customer.wallet) {
                                customer.state.kind = Math.random() < .3 ? (customer.itemsBought === 0 ? "leaving" : "looking_for_a_cashier") : "wandering";
                                if (customer.state.kind !== "wandering") customer.state.tickCounter = 0;
                                break;
                            }

                            customer.state.item = interestItem
                            customer.state.tickCounter = 0;
                        }

                        break;
                    case "searching":
                        if (!customer.state.item) {
                            customer.state.kind = "wandering";
                            customer.state.tickCounter = 0;
                            break;
                        }

                        customer.state.tickCounter++;
                        if (customer.state.tickCounter > 4 + extra) {
                            const itemWanted = customer.state.item;
                            const hasItem = stock.getItem(itemWanted).amount > 0;
                            customer.toBuyList = customer.toBuyList.filter(i => i.name !== itemWanted.name);

                            if (hasItem) {
                                const stillWantsToBuy = customer.toBuyList.length > 0 || (Math.random() > 0.6 && customer.wallet > 2.0);
                                customer.state.kind = stillWantsToBuy ? "wandering" : "looking_for_a_cashier";
                                customer.state.tickCounter = 0;
                                customer.satisfaction += 0.08;
                                customer.wallet -= itemWanted.buyPrice;
                                customer.state.item = undefined;
                                customer.itemsBought++;

                                const profit = itemWanted.sellPrice;
                                stock.removeItem(itemWanted, 1);
                                setBalance(balance + profit);
                                pushNotification(`${customer.name} comprou ${itemWanted.name} por $ ${profit.toFixed(2)}`);
                            } else {
                                customer.state.kind = "wandering";
                                customer.state.tickCounter = 0;
                                customer.state.item = undefined;
                                customer.satisfaction = Math.max(customer.satisfaction - 0.12, 0.0);

                                const leaving = Math.random() > 0.97 || customer.wallet < 2.0 || customer.satisfaction < 0.2;
                                if (leaving) {
                                    customer.state.kind = customer.itemsBought === 0 ? "leaving" : "looking_for_a_cashier";
                                    customer.satisfaction = Math.max(customer.satisfaction - 0.05, 0.0);
                                }

                                pushNotification(`${customer.name} não encontrou ${itemWanted.name}`);
                            }
                        }

                        break;
                    case "looking_for_a_cashier":
                        if (customer.state.tickCounter > 1 + extra) {
                            if (currentOccupiedCashiers >= getCashierAmount()) {
                                customer.state.kind = "waiting_in_line";
                                customer.state.tickCounter = 0;
                            } else {
                                setOccupiedCashiers(prevOccupied => prevOccupied + 1);
                                currentOccupiedCashiers++;
                                customer.state.kind = "paying";
                                customer.state.tickCounter = 0;
                                customer.satisfaction = Math.min(customer.satisfaction + 0.1, 1.0);
                            }
                        }
                        break;
                    case "waiting_in_line":
                        if (currentOccupiedCashiers < getCashierAmount()) {
                            setOccupiedCashiers(prevOccupied => prevOccupied + 1);
                            currentOccupiedCashiers++;
                            customer.state.kind = "paying";
                            customer.state.tickCounter = 0;
                        } else {
                            customer.satisfaction = Math.max(customer.satisfaction - 0.025, 0.0);
                        }
                        break;
                    case "paying":
                        let time = Math.ceil(2 + (customer.itemsBought * 1.3 / 3));
                        if (customer.state.tickCounter > time + extra) {
                            customer.state.kind = "leaving";
                            customer.state.tickCounter = 0;
                            setOccupiedCashiers(prevOccupied => Math.max(prevOccupied - 1, 0));
                            currentOccupiedCashiers--;
                        }
                        break;
                    case "leaving":
                        if (customer.state.tickCounter > 1 + extra) {
                            customersState.splice(i, 1);

                            let satisfactionString = "contente";
                            if (customer.satisfaction < .3) {
                                satisfactionString = "extremamente decepcionado";
                                setReputation(Math.max(reputation - 0.01, 0.1));
                            } else if (customer.satisfaction < .5) {
                                satisfactionString = "insatisfeito";
                                setReputation(Math.max(reputation - 0.004, 0.1));
                            } else if (customer.satisfaction < .55) {
                                satisfactionString = "decepcionado";
                                setReputation(Math.max(reputation - 0.0025, 0.1));
                            } else if (customer.satisfaction < .6) {
                                satisfactionString = "satisfeito";
                                setReputation(Math.min(reputation + 0.001, 1.0));
                            } else if (customer.satisfaction < .8) {
                                satisfactionString = "contente";
                                setReputation(Math.min(reputation + 0.003, 1.0));
                            } else {
                                satisfactionString = "extremamente contente";
                                setReputation(Math.min(reputation + 0.006, 1.0));
                            }

                            pushNotification(`${customer.name} saiu do mercado ${satisfactionString}`);
                        }
                        break;
                }
            }

            setCustomers(customersState);
        }, 1200);

        return () => clearInterval(interval);
    }, [customers, notifications]);

    return (
        <>
            <div id="tycoon">
                <Header year={1 + Math.trunc(day / 365)} day={day % 365} balance={balance} reputation={reputation} />
                <div id="game-containers">
                    <Container id="notifications-container" title="Notificações">
                        <ul id="notification-list">
                            {notifications.map((notification, index) => (
                                <li key={index} className="not-selectable">{notification}</li>
                            ))}
                        </ul>
                    </Container>

                    <Container id="items-container" title="Mercadorias">
                        <div className="categories-container">
                            {
                                Object.values(Categories).map((category, index) => (
                                    <div className="category" key={index}>
                                        <h3>{category.name}</h3>
                                        <div className="category-items">
                                            {ITEMS.filter(item => item.category.identifier === category.identifier).map((item, index) => (
                                                <ItemCard
                                                    key={index}
                                                    disabled={balance < item.buyPrice || stock.getItemMaxStock(item, getUpgradeLevel("storage")) == stock.getItem(item).amount}
                                                    emoji={item.emoji}
                                                    name={item.name}
                                                    price={item.buyPrice}
                                                    stock={stock.getItem(item).amount}
                                                    maxStock={stock.getItemMaxStock(item, getUpgradeLevel("storage"))}
                                                    onClickCallback={() => buyItem(item)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </Container>

                    <Container id="customers-container" title={`Clientes (${customers.length}/${getCustomerCapacity()})`}>
                        {customers.sort((a, b) => statePriority(b.state.kind) - statePriority(a.state.kind)).map((customer, index) => {
                            let state = "";
                            switch (customer.state.kind) {
                                case "entered":
                                    state = "Entrou no mercado";
                                    break;
                                case "wandering":
                                    state = "Caminhando pela loja";
                                    break;
                                case "searching":
                                    state = `Procurando ${customer.state.item!.name}`;
                                    break;
                                case "looking_for_a_cashier":
                                    state = "Indo até o caixa";
                                    break;
                                case "waiting_in_line":
                                    state = "Esperando na fila";
                                    break;
                                case "paying":
                                    state = "Pagando as compras";
                                    break;
                                case "leaving":
                                    state = "Saindo do mercado";
                            }

                            return (
                                <Customer
                                    key={index}
                                    name={customer.name}
                                    state={state}
                                    wallet={customer.wallet}
                                    satisfaction={customer.satisfaction}
                                />
                            );
                        })}
                    </Container>

                    <Container id="upgrades-container" title="Melhorias">
                        {upgrades.map((upgrade, index) => {
                            const descriptor = UPGRADES.find(d => d.kind === upgrade.kind)!;
                            const cost = calculateUpgradeCost(descriptor.kind, upgrade.level);
                            const canBuy = balance >= cost;

                            return (
                                <div key={index} className={`upgrade ${canBuy ? "" : "disabled"}`} onClick={() => { if (canBuy) { buyUpgrade(upgrade) } }}>
                                    <div className="emoji">{descriptor.emoji}</div>
                                    <div className="name">{descriptor.name}</div>
                                    <div className="level">Nível {upgrade.level}</div>
                                    <div className="cost">$ {cost.toFixed(2)}</div>
                                </div>
                            );
                        })}
                    </Container>
                </div>
            </div>
        </>
    )
}

export default App
