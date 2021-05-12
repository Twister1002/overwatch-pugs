import React, {useState, useEffect} from "react";
import PlayerCard from "../PlayerCard";

import "../../css/roster.min.css";
import PlayerModal from "../modals/PlayerModal";
import Modal from "../modals/Modal";

const RosterPage = function(props: {
    players: Array<IPlayer>
    onPlayerUpdate: (players: Array<IPlayer>) => void
}) {
    const [playerEditing, setPlayerEditing] = useState<IPlayer | undefined>();
    const [showPlayerModal, setShowPlayerModal] = useState<boolean>(false);

    function onPlayerDelete(player: IPlayer) {
        props.onPlayerUpdate([...props.players.filter(p => p.name !== player.name)])
    }
    
    function onPlayerEdit(player: IPlayer) {
        setPlayerEditing(player);
        setShowPlayerModal(true);
    }

    function onPlayerFormSubmit(newPlayerData: IPlayer) {
        const updatedPlayers = [...props.players];

        const playerIndex = updatedPlayers.findIndex((p) => p.name === playerEditing?.name);
        if (playerIndex !== -1) {
            // Player was found, so update it
            updatedPlayers[playerIndex] = newPlayerData;
        }
        else {
            // Player was not found, so add it
            updatedPlayers.push(newPlayerData);
        }

        props.onPlayerUpdate(updatedPlayers);

        closeModal();
    }

    function onPlayerFormCancel() {
        closeModal();
    }

    function closeModal() {
        setShowPlayerModal(false);
        setPlayerEditing(undefined);
    }

    return (
        <div>
            <div onClick={() => setShowPlayerModal(true)}>
                Create Player
            </div>
            <div className="available-players">
                {
                    props.players.map((player, i) => {
                        return <PlayerCard 
                            key={`player-${i}`} 
                            player={player}
                            isEditable={true}
                            onPlayerDelete={() => (onPlayerDelete(player))} 
                            onPlayerEdit={() => (onPlayerEdit(player))} 
                        />
                    })
                }
            </div>
            {
                showPlayerModal ? (
                    <Modal>
                        <PlayerModal 
                            isEditing={playerEditing !== undefined} 
                            player={playerEditing}
                            onPlayerSubmit={onPlayerFormSubmit}
                            onCancel={onPlayerFormCancel}
                        />
                    </Modal>
                ) : null
            }
        </div>
    )

}

export default RosterPage;