import "./Customer.css"

function Customer({ name, state, wallet, satisfaction }: { name: string; state: string; wallet: number; satisfaction: number }) {

    let emoji = "😊";
    if (satisfaction < 0.2) {
        emoji = "😫";
    } else if (satisfaction < .4) {
        emoji = "☹️";
    } else if (satisfaction < 0.5) {
        emoji = "😐"
    } else if (satisfaction < 0.6) {
        emoji = "🙂"
    } else if (satisfaction < 0.75) {
        emoji = "😊"
    } else if (satisfaction < 0.9) {
        emoji = "😄"
    } else {
        emoji = "🤩"
    }

    return (
        <div className="customer">
            <p className="emoji">{emoji}</p>
            <div className="info">
                <p className="name">{name}</p>
                <p className="balance">$ {wallet.toFixed(2)}</p>
                <p className="state">{state}</p>
            </div>
        </div>
    )
}

export default Customer;