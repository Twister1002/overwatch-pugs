import React, {useState, useEffect} from "react";

import "../../css/playermodal.min.css"

const PlayerModal = function(props: {
    player?: IPlayer
    isEditing?: boolean
    onPlayerSubmit?: (player: IPlayer) => void
    onCancel?: () => void
}) {

    function onFormSubmit(form) {
        form.preventDefault();
        
        const newPlayerData: IPlayer = {
            name: form.target.elements.name.value,
            tank: form.target.elements.tank.value,
            dps: form.target.elements.dps.value,
            support: form.target.elements.support.value
        }

        if (props.onPlayerSubmit) {
            props.onPlayerSubmit(newPlayerData);
        }

        return false;
    }

    return (
        <div id="player-modal">
            <h2>{props.isEditing ? "Edit" : "Create"} Player</h2>
            <form onSubmit={onFormSubmit}>
                <div>
                    <ul>
                        <li>
                            <div className="label">Player Name</div>
                            <div className="input">
                                <input type="text" name="name" defaultValue={props.player?.name} />
                            </div>
                        </li>
                        <li>
                            <div className="label">Tank</div>
                            <div className="input">
                                <input type="number" name="tank" min={500} max={5500} step={1} defaultValue={props.player?.tank}/>
                            </div>
                        </li>
                        <li>
                            <div className="label">DPS</div>
                            <div className="input">
                                <input type="number" name="dps" min={500} max={5500} step={1} defaultValue={props.player?.dps}/>
                            </div>
                        </li>
                        <li>
                            <div className="label">Support</div>
                            <div className="input">
                                <input type="number" name="support" min={500} max={5500} step={1} defaultValue={props.player?.support}/>
                            </div>
                        </li>
                    </ul>
                </div>
                <div className="form-buttons">
                    <button type="button" onClick={props.onCancel}>Cancel</button>
                    <button type="submit">Submit</button>
                </div>
            </form>
        </div>
    )

}

export default PlayerModal;