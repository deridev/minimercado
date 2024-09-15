import "./Container.css"

type ContainerProps = {
    children?: React.ReactNode
    id: string
    title: string
}

function Container({ children, id, title }: ContainerProps) {
    return (
        <div className="container" id={id}>
            <h2>{title}</h2>
            {children && <div className="content">{children}</div>}
        </div>
    )
}

export default Container