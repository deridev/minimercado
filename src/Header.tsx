import "./Header.css"

function Header({ year, day, balance, reputation }: { year: number; day: number; balance: number; reputation: number }) {
    return (
        <header id="header">
            <h1>Minimercado</h1>

            <div className="data">
                <p id="date">Dia {day} - Ano {year}</p>
                <p id="balance">$ {balance.toFixed(2)}</p>
                <p id="reputation"><span className="inline-icon">🌟</span> {(reputation * 100).toFixed(1)}%</p>
            </div>
        </header>
    )
}

export default Header