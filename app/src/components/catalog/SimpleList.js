import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Table, ButtonGroup, Button } from "reactstrap";
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
class SimpleList extends Component{
    constructor(props){
        super(props);
        this.state={
            data:[],
            params:{
                search: "",
                ordering: null,
            },
            model:null,
        }
    }

    refreshList(){
        axios.get(`${ApiUrl}${this.state.model.url}/`,{
                params: this.state.params,
            }).then(res=>{
                this.setState({
                    data:res.data.results
                });
            })
    };

    componentDidMount(){
        let model = this.props.model?this.props.model:this.state.model;
        let search = this.props.search?this.props.search:"";
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    search: search
                },
                model:model
            };
        });
    }

    componentDidUpdate(prevProps, prevState){
        if (prevProps.search !== this.props.search || prevProps.model !== this.props.model) {
            let model = this.props.model?this.props.model:this.state.model;
            this.setState(function (prev_State) {
                return {
                    params: {
                        ...prev_State.params,
                        search: this.props.search
                    },
                    model:model
                };
            });
		}
        if(prevState.params !== this.state.params){
            this.refreshList();
        }
    }

    onDeleteRow = (row) =>{
        if(window.confirm("¿Desea eliminar '"+row.name+"' de "+this.state.model.title+"?")){
            axios.delete(`${ApiUrl}${this.state.model.url}/${row.id}/`)
                .then(res => {
                    this.refreshList();
                });
        }
    }

    onColumnClick = (field) => {
        if(this.state.params.ordering === field){
            this.setState(function (prevState) {
                return {
                    params: {
                        ...prevState.params,
                        ordering: "-"+field
                    },
                };
            });
        } else {
            this.setState(function (prevState) {
                return {
                    params: {
                        ...prevState.params,
                        ordering: field
                    },
                };
            });
        }
    }

    sortTable = (field) => {
        if(this.state.params.ordering !== null){
            switch(this.state.params.ordering){
                case field:
                    return (<i className="bi bi-sort-alpha-down text-right"></i>)
                case "-"+field:
                    return (<i className="bi bi-sort-alpha-up text-right"></i>)
            }
        }
        return (<></>)
    }

    propertyTable= (model,row) => {
        if(model.type!==""){
            if(model.type==="properties"){
                return(<td>{row.properties_data.map((property) => (property.name+","))}</td>)
            } else {
                return(<td>{row.property_name}</td>)
            }
        }
        return (<></>)
    }

    render(){
        const data = this.state.data;
        const ordering = this.state.params.ordering;
        const model = this.state.model;
        return(
            <div>
                <p id="before-table"></p>
                <Table className="no-wrap align-middle" responsive striped bordered id="dataTable">
                    <thead>
                        <tr>
                            {model!==null&&model.type!==""?<>
                            {model.type==="properties"?<th width={"20%"}>Propiedades</th>:<th width={"20%"}>Propiedad</th>}
                            <th width={"12%"} onClick={(e)=> this.onColumnClick("id")}>ID {this.sortTable("id")}</th>
                            <th width={"55%"} onClick={(e)=> this.onColumnClick("name")}>Nombre {this.sortTable("name")}</th>
                            <th width={"13%"}></th></>
                            :<><th width={"12%"} onClick={(e)=> this.onColumnClick("id")}>ID {this.sortTable("id")}</th>
                            <th width={"75%"} onClick={(e)=> this.onColumnClick("name")}>Nombre {this.sortTable("name")}</th>
                            <th width={"13%"}></th></>}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={row.id}>
                                {this.propertyTable(model,row)}
                                <td>{row.id}</td>
                                <td>{row.name}</td>
                                <td className='text-center'>
                                <ButtonGroup>
                                    <Link to={`/catalogs/${model.name}/${row.id}`}>
                                        <Button color="info"
                                            size='sm'>
                                            <i className="bi bi-pencil-fill"></i>
                                        </Button>
                                    </Link>
                                    <Button color="warning" 
                                        size='sm'
                                        onClick={(e)=> this.onDeleteRow(row)}>
                                        <i className="bi bi-trash-fill"></i>
                                    </Button>
                                </ButtonGroup>
                                </td>
                            </tr>
                        ))} 
                    </tbody>
              </Table>
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    return <SimpleList {...props} history={history} />;
}