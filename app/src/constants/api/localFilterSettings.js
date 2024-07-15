export const loadFilterSettings = (state) => {

    try {
        const serializedState = localStorage.getItem(state);
        if(serializedState === null){
            return undefined;
        }
        return JSON.parse(serializedState);
    } catch (err) {
        console.log(err);
        return undefined;
    }
};

export const saveFilterSettings = (state,label) => {
    try{
        const serializedState = JSON.stringify(state);
        localStorage.setItem(label, serializedState);
        return JSON.parse(serializedState);
    } catch (err){
        console.log(err);
        return undefined;
    }
}