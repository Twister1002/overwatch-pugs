import React, {useState, useEffect} from "react";
import {Link} from "react-router-dom";

import "../../css/mainnav.min.css";

const MainNav = function() {

    return (
        <nav id="main-nav">
            <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/roster">Roster</Link></li>
                <li><Link to="/assign">Assign</Link></li>
            </ul>
        </nav>
    )

}

export default MainNav;