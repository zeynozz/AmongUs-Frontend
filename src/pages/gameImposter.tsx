import {Sabotage} from "../App";


type Props = {
    sabotages: Sabotage[];
};

export default function gameImposter({ sabotages }: Props) {
    return (
        <div className="flex justify-between items-start p-4">


            {/* Role Information in top center */}


            {/* Map Button on top right */}
            <div className="flex-none">
                <p>Map Button Component Goes Here</p>
            </div>
        </div>
    );
}
