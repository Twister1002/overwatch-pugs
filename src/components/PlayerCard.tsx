import "../css/player.min.css";
import {ReactComponent as DPSIcon} from "../svgs/eyedropper.svg";
import {ReactComponent as TankIcon} from "../svgs/shield.svg";
import {ReactComponent as SupportIcon} from "../svgs/plus.svg";

const PlayerCard = function(props: {
    player: IPlayer,
    isEditable?: boolean,
    onPlayerDelete?: () => void,
    onPlayerEdit?: () => void
}) {
    return (
        <div className="player">
            <header>
                {props.player.name}
            </header>
            <div className="player-info">
                {
                    props.isEditable ? (
                        <ul className="player-options">

                            <li className="clickable edit" onClick={props.onPlayerEdit}>EDIT</li>
                            <li className="clickable delete" onClick={props.onPlayerDelete}>DELETE</li>
                        </ul>
                    ) : null
                }
                <div className="ranks">
                    <div className="tank">
                        <TankIcon className="icon" /> 
                        <span className="sr">{props.player.tank}</span>
                    </div>
                    <div className="dps">
                        <DPSIcon className="icon" /> 
                        <span className="sr">{props.player.dps}</span>
                    </div>
                    <div className="support">
                        <SupportIcon className="icon" /> 
                        <span className="sr">{props.player.support}</span>
                    </div>
                </div>
            </div>
        </div>
    )

}

export default PlayerCard;