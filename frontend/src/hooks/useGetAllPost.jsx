import { useDispatch } from "react-redux";
import { setPosts } from "@/redux/postSlice";
import axios from "axios";
import { useEffect } from "react";

const useGetAllPost = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchAllPost = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/v1/post/all', { withCredentials: true });
        if (res.data.success) {
            console.log(res.data.posts)
          dispatch(setPosts(res.data.posts));
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchAllPost(); // Call the function inside useEffect
  }, [dispatch]); // Add dispatch to the dependency array to avoid stale closure
};

export default useGetAllPost;
