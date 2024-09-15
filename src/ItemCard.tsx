import "./ItemCard.css"

type ItemCardProps = {
    emoji: string
    disabled: boolean
    name: string
    price: number
    stock: number
    maxStock: number
    onClickCallback?: () => void
}

function ItemCard({ emoji, disabled, name, price, stock, maxStock, onClickCallback }: ItemCardProps) {
    return (
        <div className={`item-card not-selectable ${disabled ? "disabled" : ""}`} onClick={(e) => { e.preventDefault(); onClickCallback?.() }}> 
            <div className="emoji not-selectable">{emoji}</div>
            <div className="name">{name}</div>
            <div className="price">$ {price}</div>
            <div className="stock-bar not-selectable">
                <div className="stock-bar-progress" style={{ width: `${(stock / maxStock) * 100}%` }}></div>
            </div>
            <p className="stock-text not-selectable">{stock} / {maxStock}</p>
        </div>
    )
}
export default ItemCard;