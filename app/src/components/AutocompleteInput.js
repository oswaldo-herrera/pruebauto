import React, { useState } from 'react';
import { Input, ListGroup, ListGroupItem } from 'reactstrap';

const AutocompleteInput = ({ options, name, value, onChange }) => {
	const [filteredOptions, setFilteredOptions] = useState([]);
	const [showList, setshowList] = useState(false);

	const handleInputChange = (event) => {
		onChange(event);
		handleValueFilter(event.target.value);
	};

	const handleOptionClick = (option) => {
		onChange({
			'target':{
				'value':option,
				'name':name
			},
		});
		setFilteredOptions([]);
	};

	function handleValueFilter(value){
		const filtered = options.filter(option =>
			option.toLowerCase().includes(value.toLowerCase())
		);
		setFilteredOptions(filtered);
	}


  return (
    <div>
		<Input
			type="text"
			bsSize="sm"
			name={name}
			value={value}
			onChange={handleInputChange}
			onFocus={(event)=>{
				setshowList(true);
			}}
			required
		/>
		{showList?
    	<ListGroup style={{position:'absolute'}}>
        	{filteredOptions.map((option, index) => (
				<ListGroupItem
					action
					key={index}
					tag="button"
					onClick={() => {
						handleOptionClick(option);
						setshowList(false);
					}}>
					{option}
				</ListGroupItem>
        	))}
      	</ListGroup>:<></>}
    </div>
	);
};

export default AutocompleteInput;