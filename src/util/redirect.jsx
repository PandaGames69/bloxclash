import {useNavigate} from "@solidjs/router";

export const Redirect = () => {
    const navigate = useNavigate();
    navigate('/');
    return <></>;
};