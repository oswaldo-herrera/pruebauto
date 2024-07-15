import React,{Component} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, ButtonGroup, Button } from "reactstrap";
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
class StoreList extends Component{
    constructor(){
        super();
        this.state={
            data:[],
            params:{
                search: "",
                ordering: "code",
                limit: 200,
            }
        }
    }

    refreshList(){
        axios.get(`${ApiUrl}general/stores/`,{
            params: this.state.params,
        }).then(res=>{
            this.setState({
                data:res.data.results
            });
        })
    };

    componentDidMount(){
        let search = this.props.search?this.props.search:"";
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    search: search
                },
            };
        });
    }

    componentDidUpdate(prevProps, prevState){
        if (prevProps.search !== this.props.search) {
            this.setState(function (prev_State) {
                return {
                    params: {
                        ...prev_State.params,
                        search: this.props.search
                    },
                };
            });
		}
        if(prevState.params !== this.state.params){
            this.refreshList();
        }
    }

    onDeleteRow = (row) =>{
        if(window.confirm("¿Desea eliminar '"+row.name+"' de Tiendas?")){
            axios.delete(`${ApiUrl}general/stores/${row.id}/`)
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

    render(){
        const data = this.state.data;
        return(
            <div>
                <p id="before-table"></p>
                <Table className="no-wrap align-middle" responsive striped bordered id="dataTable">
                    <thead>
                        <tr>
                            <th width={"12%"} onClick={(e)=> this.onColumnClick("code")}>Código {this.sortTable("code")}</th>
                            <th width={"75%"} onClick={(e)=> this.onColumnClick("name")}>Nombre {this.sortTable("name")}</th>
                            <th width={"13%"}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={row.id}>
                                <td>{row.code.toString().padStart(10, '0')}</td>
                                <td>{row.name}</td>
                                <td className='text-center'>
                                <ButtonGroup>
                                    <Link to={`/catalogs/store/${row.id}`}>
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
    return <StoreList {...props} history={history} />;
}