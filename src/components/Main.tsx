import React, {useState, useEffect} from "react";
import "../css/main.min.css";
import MainNav from "./navs/MainNav";
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import HomePage from "./pages/HomePage";
import RosterPage from "./pages/RosterPage";

import dummyPlayers from "../data/players.json";

const Main = function(props) {
    const [players, setPlayers] = useState<Array<IPlayer>>(dummyPlayers);

    return (
        <div id="app-main">
            <Router>
                <MainNav />
                
                <Switch>
                    <Route exact path="/">
                        <HomePage />
                    </Route>

                    <Route exact path="/roster">
                        <RosterPage players={players} onPlayerUpdate={setPlayers}/>
                    </Route>

                </Switch>
            </Router>
        </div>
    )

}

export default Main;